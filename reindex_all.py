"""
One-off backfill / reindex utility.

Fixes two data problems:
  1. unidentified_bodies rows bulk-loaded via populate_unidentified_bodies.py
     stored profile_photo as a bare filename ("1.jpg") instead of a project
     relative path ("photos/unidentified_bodies/1.jpg"), and were never added
     to the Qdrant vector database, so they could never be searched/matched.
  2. Rebuilds the Qdrant collections and indexes EVERY missing person and
     unidentified body using collision-free point IDs (uuid5 of the PID),
     replacing the old scheme that keyed points by the integer table id
     (which collided between the two tables).

IMPORTANT: run this with the API server STOPPED — the on-disk Qdrant store
allows only one process at a time.

    python reindex_all.py
"""
import os
import shutil
import sqlite3

# Run from the project root regardless of where it's invoked
os.chdir(os.path.dirname(os.path.abspath(__file__)))

from qdrant_client.models import Distance, VectorParams, PointStruct  # noqa: E402

QDRANT_DATA_PATH = "./qdrant_data"
UIDB_DIR = "photos/unidentified_bodies"

# Reuse the application's DB, embedders, and helpers so indexing matches exactly
# what the live report endpoints produce. Bound in __main__ AFTER wiping the
# on-disk store, because importing main.py connects to Qdrant.
main = None
DB_FILE = "missing_persons.db"


def normalize_body_photos():
    """Turn bare-filename body photos into project-relative paths."""
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    fixed = 0
    rows = cur.execute(
        "SELECT id, pid, profile_photo FROM unidentified_bodies"
    ).fetchall()
    for id_, pid, photo in rows:
        if not photo:
            continue
        norm = photo.replace("\\", "/")
        if "/" in norm:
            continue  # already has a directory component
        candidate = f"{UIDB_DIR}/{photo}"
        if os.path.exists(candidate):
            cur.execute(
                "UPDATE unidentified_bodies SET profile_photo=? WHERE id=?",
                (candidate, id_),
            )
            fixed += 1
        else:
            print(f"  ! {pid}: {candidate} not found on disk")
    conn.commit()
    conn.close()
    print(f"Normalized {fixed} body photo path(s)")


def recreate_collections():
    client = main.qdrant_client
    for name, size in (("face_embeddings", 512), ("text_embeddings", 768)):
        try:
            client.delete_collection(name)
        except Exception:
            pass
        client.create_collection(
            collection_name=name,
            vectors_config=VectorParams(size=size, distance=Distance.COSINE),
        )
    print("Recreated collections: face_embeddings(512D) + text_embeddings(768D)")


def index_table(table, record_type):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(f"SELECT * FROM {table}").fetchall()
    conn.close()

    text_n = face_n = 0
    for row in rows:
        r = dict(row)
        pid = r["pid"]
        desc = main.generate_text_description(r)
        meta = {
            "pid": pid,
            "record_type": record_type,
            "gender": r.get("gender"),
            "estimated_age": r.get("estimated_age") or r.get("age"),
            "height_cm": r.get("height_cm"),
            "police_station": r.get("police_station"),
            "status": r.get("status", "Open"),
            "description": desc,
            "name": r.get("name"),
        }
        meta = {k: v for k, v in meta.items() if v is not None}
        pt_id = main.point_id_for(pid)

        # Text embedding (always possible)
        try:
            emb = main.text_embedder.get_embedding(desc)
            main.qdrant_client.upsert(
                "text_embeddings",
                [PointStruct(id=pt_id, vector=emb.tolist(), payload=meta)],
            )
            text_n += 1
        except Exception as e:
            print(f"  ! {pid} text embed failed: {e}")

        # Face embedding (only if a usable photo with a detectable face exists)
        photo = r.get("profile_photo")
        if main.FACE_RECOGNITION_AVAILABLE and photo:
            full = photo if os.path.isabs(photo) else os.path.join(os.getcwd(), photo)
            if os.path.exists(full):
                try:
                    femb = main.face_extractor.extract_embedding(
                        full, return_normalized=True
                    )
                    main.qdrant_client.upsert(
                        "face_embeddings",
                        [PointStruct(id=pt_id, vector=femb.tolist(), payload=meta)],
                    )
                    face_n += 1
                except Exception as e:
                    print(f"  ! {pid} face embed failed (no detectable face?): {e}")
            else:
                print(f"  ! {pid} photo missing on disk: {full}")

    print(f"{table}: {text_n} text embeddings, {face_n} face embeddings")


if __name__ == "__main__":
    # Guarantee a clean slate: Qdrant local-mode delete_collection does not
    # reliably purge on-disk points, so remove the store before (re)connecting.
    # All vectors are re-derivable from SQLite, so this is safe.
    if os.path.exists(QDRANT_DATA_PATH):
        shutil.rmtree(QDRANT_DATA_PATH)
        print(f"Wiped {QDRANT_DATA_PATH}")

    import main  # noqa: E402  (connects to the now-clean Qdrant store)
    DB_FILE = main.DB_FILE

    print("== 1. Normalizing unidentified body photo paths ==")
    normalize_body_photos()
    print("\n== 2. Rebuilding Qdrant collections ==")
    recreate_collections()
    print("\n== 3. Indexing missing_persons ==")
    index_table("missing_persons", "missing_person")
    print("\n== 4. Indexing unidentified_bodies ==")
    index_table("unidentified_bodies", "unidentified_body")
    print("\nDone. Restart the API server to use the rebuilt index.")
