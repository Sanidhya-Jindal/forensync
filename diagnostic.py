"""Backend System Diagnostic Script"""
import sys
import os

print("=" * 70)
print("BACKEND END-TO-END ANALYSIS")
print("=" * 70)

# Check Python version
print(f"\n1. Python Version: {sys.version}")

# Check key dependencies
print("\n2. Dependency Check:")
dependencies = [
    ('fastapi', 'FastAPI'),
    ('uvicorn', 'Uvicorn'),
    ('qdrant_client', 'Qdrant Client'),
    ('pydantic', 'Pydantic'),
    ('numpy', 'NumPy'),
    ('sentence_transformers', 'Sentence Transformers'),
]

missing_deps = []
for module, name in dependencies:
    try:
        __import__(module)
        print(f"   ✓ {name}")
    except ImportError as e:
        print(f"   ✗ {name} - {e}")
        missing_deps.append(name)

# Optional: Face recognition
print("\n3. Face Recognition (Optional):")
try:
    import cv2
    print(f"   ✓ OpenCV ({cv2.__version__})")
except:
    print("   ✗ OpenCV - Not installed")
try:
    import insightface
    print("   ✓ InsightFace")
except:
    print("   ✗ InsightFace - Not installed")

# Check Database
print("\n4. SQLite Database Check:")
import sqlite3
try:
    conn = sqlite3.connect('missing_persons.db')
    cursor = conn.cursor()
    
    # Get tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"   Database: missing_persons.db")
    print(f"   Tables: {len(tables)}")
    
    expected_tables = ['unidentified_bodies', 'missing_persons', 'preliminary_uidb_reports']
    for table in expected_tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"     - {table}: {count} records")
    
    conn.close()
    print("   ✓ Database connection OK")
except Exception as e:
    print(f"   ✗ Database error: {e}")

# Check Qdrant
print("\n5. Vector Database (Qdrant) Check:")
try:
    from qdrant_client import QdrantClient
    client = QdrantClient(path="./qdrant_data")
    collections = client.get_collections().collections
    print(f"   Qdrant path: ./qdrant_data")
    print(f"   Collections: {len(collections)}")
    for col in collections:
        info = client.get_collection(col.name)
        print(f"     - {col.name}: {info.points_count} points")
    print("   ✓ Qdrant connection OK")
except Exception as e:
    print(f"   ✗ Qdrant error: {e}")

# Check Text Embedder
print("\n6. Text Embedder Check:")
try:
    from text_embedder import TextEmbedder
    embedder = TextEmbedder()
    test_text = "Male, 25 years old"
    embedding = embedder.get_embedding(test_text)
    print(f"   Model: all-mpnet-base-v2")
    print(f"   Embedding dimensions: {embedding.shape[0]}")
    print("   ✓ Text embedder working")
except Exception as e:
    print(f"   ✗ Text embedder error: {e}")

# Check Vector Retrieval
print("\n7. Vector Retrieval Check:")
try:
    from vector_retrieval import VectorRetrieval
    from qdrant_client import QdrantClient
    client = QdrantClient(path="./qdrant_data")
    retrieval = VectorRetrieval(qdrant_path="./qdrant_data", client=client)
    print("   ✓ Vector retrieval initialized")
except Exception as e:
    print(f"   ✗ Vector retrieval error: {e}")

# Check Photos Directory
print("\n8. Photos Directory Check:")
photo_dirs = ['photos/unidentified_bodies', 'photos/missing_persons', 'photos/preliminary_uidb']
for dir_path in photo_dirs:
    if os.path.exists(dir_path):
        count = len([f for f in os.listdir(dir_path) if os.path.isdir(os.path.join(dir_path, f))])
        print(f"   {dir_path}: {count} person folders")
    else:
        print(f"   {dir_path}: Not created yet")

# Summary
print("\n" + "=" * 70)
print("SUMMARY")
print("=" * 70)
if missing_deps:
    print(f"   ⚠ Missing dependencies: {', '.join(missing_deps)}")
    print("   Run: pip install -r requirements_api.txt")
else:
    print("   ✓ All core dependencies installed")

print("\n   To start the API server:")
print("   python main.py")
print("\n   To test the API:")
print("   python test_api.py")
print("=" * 70)
