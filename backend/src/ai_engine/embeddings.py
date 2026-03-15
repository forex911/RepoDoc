from transformers import AutoTokenizer, AutoModel
import torch

TOKENIZER = None
MODEL = None

def load_model():
    global TOKENIZER, MODEL
    if TOKENIZER is None or MODEL is None:
        import logging
        logging.info("Lazy loading CodeBERT model...")
        TOKENIZER = AutoTokenizer.from_pretrained("microsoft/codebert-base")
        MODEL = AutoModel.from_pretrained("microsoft/codebert-base")


def embed_code(code):
    if MODEL is None:
        load_model()

    tokens = TOKENIZER(code, return_tensors="pt", truncation=True)

    with torch.no_grad():
        output = MODEL(**tokens)

    embedding = output.last_hidden_state.mean(dim=1)
    return embedding