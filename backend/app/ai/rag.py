from typing import List, Tuple
import json

class RAGSystem:
    def __init__(self):
        self.embedding_model = None
        self.is_loaded = False
    
    def load_embedding_model(self):
        if self.is_loaded:
            return True
        
        print("Loading embedding model...")
        try:
            from sentence_transformers import SentenceTransformer
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            self.is_loaded = True
            print("✅ Embedding model loaded!")
            return True
        except Exception as e:
            print(f"⚠️  Could not load embedding model: {e}")
            self.is_loaded = False
            return False
    
    def chunk_text(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        words = text.split()
        chunks = []
        
        for i in range(0, len(words), chunk_size - overlap):
            chunk = ' '.join(words[i:i + chunk_size])
            if chunk:
                chunks.append(chunk)
        
        return chunks
    
    def generate_embedding(self, text: str) -> List[float]:
        if not self.is_loaded:
            self.load_embedding_model()
        
        if self.embedding_model:
            embedding = self.embedding_model.encode(text, convert_to_tensor=False)
            return embedding.tolist()
        return []
    
    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        if not self.is_loaded:
            self.load_embedding_model()
        
        if self.embedding_model:
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        return []
    
    def retrieve_relevant_chunks(self, query: str, chunks_with_embeddings: List[Tuple[str, List[float]]], top_k: int = 3) -> List[str]:
        return [chunk for chunk, _ in chunks_with_embeddings[:top_k]]
    
    def build_rag_prompt(self, query: str, context_chunks: List[str]) -> str:
        context = "\n\n".join(context_chunks)
        prompt = f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
        return prompt

rag_system = RAGSystem()