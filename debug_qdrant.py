"""Debug Qdrant connection"""
import traceback
from qdrant_client import QdrantClient

print("Testing Qdrant connection...")
try:
    client = QdrantClient(path='./qdrant_data')
    print("✓ Client created")
    
    cols = client.get_collections()
    print(f"✓ Got collections: {len(cols.collections)}")
    for c in cols.collections:
        print(f"  - {c.name}")
        
    # Try to get collection info
    for c in cols.collections:
        try:
            info = client.get_collection(c.name)
            print(f"  {c.name}: {info.points_count} points, status={info.status}")
        except Exception as e:
            print(f"  ✗ Error getting {c.name} info: {e}")
            
except Exception as e:
    print(f"✗ Error: {e}")
    traceback.print_exc()
