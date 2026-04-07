"""Create fresh Qdrant collections"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

print("Creating fresh Qdrant collections...")

# Create client (this will create the folder)
client = QdrantClient(path='./qdrant_data')
print(f"✓ Client created")

# Create face_embeddings collection
client.create_collection(
    collection_name='face_embeddings',
    vectors_config=VectorParams(size=512, distance=Distance.COSINE)
)
print(f"✓ Created face_embeddings (512D)")

# Create text_embeddings collection
client.create_collection(
    collection_name='text_embeddings',
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)
print(f"✓ Created text_embeddings (768D)")

# Verify
cols = client.get_collections()
print(f"\nCollections: {len(cols.collections)}")
for c in cols.collections:
    info = client.get_collection(c.name)
    print(f"  - {c.name}: {info.points_count} points, {info.config.params.vectors.size}D, {info.status}")

print("\n✓ Qdrant setup complete!")
