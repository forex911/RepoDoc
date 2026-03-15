from sklearn.metrics.pairwise import cosine_similarity


def detect_similarity(embeddings):

    similar_pairs = []

    for i in range(len(embeddings)):
        for j in range(i+1, len(embeddings)):

            sim = cosine_similarity(
                embeddings[i], embeddings[j]
            )[0][0]

            if sim > 0.9:
                similar_pairs.append((i, j))

    return similar_pairs