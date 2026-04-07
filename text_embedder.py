"""
Text Embedding Extraction using Sentence Transformers
Simple class for converting text to vector embeddings (fully local, no API key needed)
"""

from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List


# Model: all-mpnet-base-v2 — 768 dimensions, top-tier quality for semantic search
MODEL_NAME = "all-mpnet-base-v2"
EMBEDDING_DIM = 768


class TextEmbedder:
    """
    A simple class for extracting text embeddings using Sentence Transformers.
    Uses the all-mpnet-base-v2 model (768 dimensions).
    Runs fully locally — no API key required.
    """
    
    def __init__(self, model_name: str = MODEL_NAME):
        """
        Initialize the Sentence Transformer model.
        
        Args:
            model_name: HuggingFace model name (default: all-mpnet-base-v2)
        """
        print(f"Loading text embedding model: {model_name}...")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        
        print(f"✓ TextEmbedder initialized: {model_name} ({self.embedding_dim} dimensions)")
    
    def get_embedding(self, text: str) -> np.ndarray:
        """
        Get embedding vector for a single text string.
        
        Args:
            text: Input text to embed
            
        Returns:
            Numpy array of embedding (768,)
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        # Encode text to embedding
        embedding = self.model.encode(text, convert_to_numpy=True)
        
        return embedding
    
    def get_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Get embeddings for multiple texts in a single call (more efficient).
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of numpy arrays, each (768,)
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")
        
        # Filter out empty strings
        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            raise ValueError("All texts are empty")
        
        # Batch encode (much faster than one-by-one)
        embeddings = self.model.encode(valid_texts, convert_to_numpy=True, show_progress_bar=False)
        
        return [emb for emb in embeddings]
    
    def compute_similarity(self, embedding1: np.ndarray, embedding2: np.ndarray) -> float:
        """
        Compute cosine similarity between two embeddings.
        
        Args:
            embedding1: First embedding vector
            embedding2: Second embedding vector
            
        Returns:
            Similarity score between -1 and 1 (higher = more similar)
        """
        # Normalize embeddings
        norm1 = embedding1 / np.linalg.norm(embedding1)
        norm2 = embedding2 / np.linalg.norm(embedding2)
        
        # Cosine similarity
        similarity = np.dot(norm1, norm2)
        
        return float(similarity)
    
    def find_most_similar(self, query_text: str, candidate_texts: List[str]) -> List[dict]:
        """
        Find most similar texts to a query text.
        
        Args:
            query_text: The query text to compare against
            candidate_texts: List of candidate texts to compare
            
        Returns:
            List of dicts with 'text', 'similarity', and 'index', sorted by similarity
        """
        # Get query embedding
        query_embedding = self.get_embedding(query_text)
        
        # Get candidate embeddings (batch for efficiency)
        candidate_embeddings = self.get_embeddings_batch(candidate_texts)
        
        # Compute similarities
        results = []
        for idx, (text, emb) in enumerate(zip(candidate_texts, candidate_embeddings)):
            similarity = self.compute_similarity(query_embedding, emb)
            results.append({
                'text': text,
                'similarity': similarity,
                'index': idx
            })
        
        # Sort by similarity (highest first)
        results.sort(key=lambda x: x['similarity'], reverse=True)
        
        return results


# Example usage
if __name__ == "__main__":
    """
    Example usage of the TextEmbedder class
    
    Setup:
    1. Install: pip install sentence-transformers
    2. Run this script (model downloads automatically on first run)
    """
    
    print("\n" + "="*60)
    print("TEXT EMBEDDING EXAMPLES (Sentence Transformers)")
    print("="*60)
    
    try:
        # Initialize embedder
        embedder = TextEmbedder()
        
        # Example 1: Single text embedding
        print("\n--- Example 1: Single Text Embedding ---")
        text = "Male, 25 years old, athletic build, black hair, brown eyes"
        embedding = embedder.get_embedding(text)
        print(f"✓ Text: {text}")
        print(f"✓ Embedding shape: {embedding.shape}")
        print(f"✓ Sample values: {embedding[:5]}")
        
        # Example 2: Batch embeddings
        print("\n--- Example 2: Batch Text Embeddings ---")
        texts = [
            "Male, 25, athletic, black hair",
            "Female, 30, slim, blonde hair",
            "Male, 40, heavy build, bald"
        ]
        embeddings = embedder.get_embeddings_batch(texts)
        print(f"✓ Processed {len(embeddings)} texts")
        for i, emb in enumerate(embeddings):
            print(f"  Text {i+1}: {emb.shape}")
        
        # Example 3: Similarity comparison
        print("\n--- Example 3: Similarity Comparison ---")
        text1 = "Young male with dark hair and athletic build"
        text2 = "25 year old man, fit body, black hair"
        text3 = "Elderly woman with gray hair"
        
        emb1 = embedder.get_embedding(text1)
        emb2 = embedder.get_embedding(text2)
        emb3 = embedder.get_embedding(text3)
        
        sim_12 = embedder.compute_similarity(emb1, emb2)
        sim_13 = embedder.compute_similarity(emb1, emb3)
        
        print(f"✓ Similarity (text1 vs text2): {sim_12:.4f}")
        print(f"✓ Similarity (text1 vs text3): {sim_13:.4f}")
        
        # Example 4: Find most similar
        print("\n--- Example 4: Find Most Similar ---")
        query = "Missing person: Male, 25, athletic, black hair"
        candidates = [
            "Young man, fit, dark hair, brown eyes",
            "Female, 30, blonde, slim build",
            "Male, 26, muscular, black hair",
            "Elderly male, gray hair, overweight"
        ]
        
        results = embedder.find_most_similar(query, candidates)
        print(f"✓ Query: {query}")
        print(f"✓ Top matches:")
        for i, result in enumerate(results[:3]):
            print(f"  {i+1}. [{result['similarity']:.4f}] {result['text']}")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nMake sure to install sentence-transformers:")
        print("  pip install sentence-transformers")
    
    print("\n" + "="*60)
