import os
import ast
import networkx as nx
from networkx.drawing.nx_pydot import write_dot


def extract_imports(file_path):

    imports = []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            tree = ast.parse(f.read())

        for node in ast.walk(tree):

            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)

            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)

    except:
        pass

    return imports


def build_dependency_graph(repo_path):

    graph = nx.DiGraph()

    for root, dirs, files in os.walk(repo_path):

        for file in files:

            if file.endswith(".py"):

                path = os.path.join(root, file)

                module_name = os.path.relpath(path, repo_path)

                imports = extract_imports(path)

                for imp in imports:
                    graph.add_edge(module_name, imp)

    return graph


def generate_architecture_diagram(repo_path):

    graph = build_dependency_graph(repo_path)

    output_dot = "architecture.dot"
    output_png = "architecture.png"

    write_dot(graph, output_dot)

    os.system(f"dot -Tpng {output_dot} -o {output_png}")

    return output_png