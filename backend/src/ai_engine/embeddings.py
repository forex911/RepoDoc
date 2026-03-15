from transformers import AutoTokenizer, AutoModel
import torch

tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
model = AutoModel.from_pretrained("microsoft/codebert-base")


def embed_code(code):

    tokens = tokenizer(code, return_tensors="pt", truncation=True)

    with torch.no_grad():
        output = model(**tokens)

    embedding = output.last_hidden_state.mean(dim=1)

    return embedding