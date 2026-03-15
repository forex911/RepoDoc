import logging
import torch

MODEL = None

def get_model():
    global MODEL
    if MODEL is None:
        logging.info("Lazy loading CodeBERT model via SentenceTransformer...")
        from sentence_transformers import SentenceTransformer
        MODEL = SentenceTransformer("microsoft/codebert-base")
    return MODEL

def embed_code(code):
    model = get_model()
    # SentenceTransformer outputs a numpy array or torch tensor based on settings.
    # We'll just generate the embedding directly using its `.encode` method
    # and convert it to a compatible 2D tensor format as expected downstream.
    embedding = model.encode(code, convert_to_tensor=True)
    if embedding.dim() == 1:
        embedding = embedding.unsqueeze(0)
    return embedding