import networkx as nx


def detect_cycles(graph):

    try:
        cycles = list(nx.simple_cycles(graph))
        return cycles
    except:
        return []