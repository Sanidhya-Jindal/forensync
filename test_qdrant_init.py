"""Test Qdrant initialization directly"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams
from vector_retrieval import VectorRetrieval

print("Testing Qdrant initialization...")

try:
    # Step 1: Create client
    client = QdrantClient(path='./qdrant_data')
    print("✓ QdrantClient created")
    
    # Step 2: Test get_collections
    cols = client.get_collections()
    print(f"✓ Collections: {[c.name for c in cols.collections]}")
    
    # Step 3: Test VectorRetrieval
    retrieval = VectorRetrieval(qdrant_path='./qdrant_data', client=client)
    print("✓ VectorRetrieval created")
    
    print("\n✗ All components initialized successfully!")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
