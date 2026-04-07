"""Create clean Qdrant collections"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

print("Creating clean Qdrant collections...")

# This creates the directory and meta.json
client = QdrantClient(path='./qdrant_data')

# Create collections with minimal config
client.create_collection(
    collection_name='face_embeddings',
    vectors_config=VectorParams(size=512, distance=Distance.COSINE)
)
print("✓ face_embeddings created")

client.create_collection(
    collection_name='text_embeddings',
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)
print("✓ text_embeddings created")

# Verify
cols = client.get_collections()
print(f"\nCollections: {[c.name for c in cols.collections]}")

for c in cols.collections:
    info = client.get_collection(c.name)
    print(f"  {c.name}: {info.points_count} points")

print("\n✓ Clean Qdrant setup complete!")
