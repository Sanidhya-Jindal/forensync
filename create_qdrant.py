"""Create Qdrant collections with Pydantic v2 compatibility"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

print("Creating Qdrant collections with Pydantic v2 compatibility...")

# Create client
client = QdrantClient(path='./qdrant_data')

# Create face_embeddings collection (minimal config)
client.create_collection(
    collection_name='face_embeddings',
    vectors_config=VectorParams(size=512, distance=Distance.COSINE)
)
print("✓ Created face_embeddings")

# Create text_embeddings collection (minimal config)
client.create_collection(
    collection_name='text_embeddings', 
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)
print("✓ Created text_embeddings")

# Test connection
cols = client.get_collections()
print(f"Collections: {[c.name for c in cols.collections]}")

for c in cols.collections:
    info = client.get_collection(c.name)
    print(f"  {c.name}: {info.points_count} points")

print("\n✓ Qdrant setup complete!")
