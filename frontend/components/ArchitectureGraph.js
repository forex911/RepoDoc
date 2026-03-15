"use client"

import { useEffect, useRef, useState } from "react"
import { Icons } from "./Icons"

export default function ArchitectureGraph({ graphData }) {
  const containerRef = useRef(null)
  const cyRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeCount, setNodeCount] = useState(0)

  useEffect(() => {
    if (!graphData || !containerRef.current) return
    if (!graphData.nodes || graphData.nodes.length === 0) return

    let cy = null

    const initCytoscape = async () => {
      const cytoscape = (await import("cytoscape")).default
      const dagre = (await import("cytoscape-dagre")).default
      cytoscape.use(dagre)

      cy = cytoscape({
        container: containerRef.current,
        elements: [
          ...graphData.nodes.map(n => ({
            data: { id: n.id, label: n.id.split(/[/\\]/).pop() }
          })),
          ...graphData.edges.map((e, i) => ({
            data: { id: `e${i}`, source: e.source, target: e.target }
          }))
        ],
        style: [
          {
            selector: "node",
            style: {
              "background-color": "#6366f1",
              "label": "data(label)",
              "color": "#e8ecf4",
              "font-size": "10px",
              "font-family": "'JetBrains Mono', monospace",
              "text-valign": "bottom",
              "text-margin-y": 6,
              "width": 28,
              "height": 28,
              "border-width": 2,
              "border-color": "#818cf8",
              "text-outline-width": 2,
              "text-outline-color": "#06090f",
              "transition-property": "background-color, border-color, width, height",
              "transition-duration": "0.2s"
            }
          },
          {
            selector: "edge",
            style: {
              "width": 1.5,
              "line-color": "rgba(99, 102, 241, 0.3)",
              "target-arrow-color": "rgba(99, 102, 241, 0.5)",
              "target-arrow-shape": "triangle",
              "curve-style": "bezier",
              "arrow-scale": 0.8,
              "transition-property": "line-color, target-arrow-color, width",
              "transition-duration": "0.2s"
            }
          },
          {
            selector: "node.highlighted",
            style: {
              "background-color": "#34d399",
              "border-color": "#34d399",
              "width": 36,
              "height": 36,
              "font-size": "12px",
              "z-index": 10
            }
          },
          {
            selector: "node.neighbor",
            style: {
              "background-color": "#fbbf24",
              "border-color": "#fbbf24",
              "width": 32,
              "height": 32
            }
          },
          {
            selector: "edge.highlighted",
            style: {
              "line-color": "#34d399",
              "target-arrow-color": "#34d399",
              "width": 3
            }
          },
          {
            selector: "node.cycle",
            style: {
              "background-color": "#f87171",
              "border-color": "#f87171"
            }
          },
          {
            selector: "edge.cycle",
            style: {
              "line-color": "#f87171",
              "target-arrow-color": "#f87171",
              "width": 2.5,
              "line-style": "dashed"
            }
          },
          {
            selector: "node.dimmed",
            style: {
              "opacity": 0.2
            }
          },
          {
            selector: "edge.dimmed",
            style: {
              "opacity": 0.1
            }
          }
        ],
        layout: {
          name: "dagre",
          rankDir: "TB",
          spacingFactor: 1.4,
          nodeSep: 40,
          rankSep: 60,
          animate: true,
          animationDuration: 500
        },
        minZoom: 0.3,
        maxZoom: 3,
        wheelSensitivity: 0.3
      })

      setNodeCount(graphData.nodes.length)

      // Detect cycles
      const cycles = detectCycles(graphData)
      const cycleNodes = new Set()
      const cycleEdges = new Set()
      cycles.forEach(cycle => {
        cycle.forEach((node, idx) => {
          cycleNodes.add(node)
          if (idx < cycle.length - 1) {
            cycleEdges.add(`${node}->${cycle[idx + 1]}`)
          }
        })
      })

      // Mark cycle nodes and edges
      cy.nodes().forEach(node => {
        if (cycleNodes.has(node.id())) {
          node.addClass("cycle")
        }
      })

      cy.edges().forEach(edge => {
        const key = `${edge.source().id()}->${edge.target().id()}`
        if (cycleEdges.has(key)) {
          edge.addClass("cycle")
        }
      })

      // Click handler
      cy.on("tap", "node", (evt) => {
        const node = evt.target
        cy.elements().removeClass("highlighted neighbor dimmed")

        // Dim everything first
        cy.elements().addClass("dimmed")

        // Highlight clicked node
        node.removeClass("dimmed").addClass("highlighted")

        // Highlight connected edges and neighbors
        const connectedEdges = node.connectedEdges()
        connectedEdges.removeClass("dimmed").addClass("highlighted")

        const neighbors = node.neighborhood("node")
        neighbors.removeClass("dimmed").addClass("neighbor")

        setSelectedNode({
          id: node.id(),
          dependencies: neighbors.map(n => n.id()),
          edgeCount: connectedEdges.length
        })
      })

      // Click background to reset
      cy.on("tap", (evt) => {
        if (evt.target === cy) {
          cy.elements().removeClass("highlighted neighbor dimmed")
          setSelectedNode(null)
        }
      })

      cyRef.current = cy
    }

    initCytoscape()

    return () => {
      if (cy) cy.destroy()
    }
  }, [graphData])

  function detectCycles(graph) {
    const adjList = {}
    graph.edges.forEach(e => {
      if (!adjList[e.source]) adjList[e.source] = []
      adjList[e.source].push(e.target)
    })

    const visited = new Set()
    const recStack = new Set()
    const cycles = []

    function dfs(node, path) {
      visited.add(node)
      recStack.add(node)
      path.push(node)

      const neighbors = adjList[node] || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path])
        } else if (recStack.has(neighbor)) {
          const cycleStart = path.indexOf(neighbor)
          if (cycleStart !== -1) {
            cycles.push(path.slice(cycleStart).concat(neighbor))
          }
        }
      }

      recStack.delete(node)
    }

    Object.keys(adjList).forEach(node => {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    })

    return cycles.slice(0, 5) // Limit cycles shown
  }

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 30)
      cyRef.current.elements().removeClass("highlighted neighbor dimmed")
      setSelectedNode(null)
    }
  }

  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="card full-width">
        <div className="card-header">
          <span className="card-header-icon icon icon-md">{Icons.network}</span>
          <h2 className="card-title">Architecture Graph</h2>
        </div>
        <div className="empty-state">
          <div className="empty-state-icon icon icon-lg">{Icons.network}</div>
          No architecture data available
        </div>
      </div>
    )
  }

  return (
    <div className="card full-width">
      <div className="card-header">
        <span className="card-header-icon icon icon-md">{Icons.network}</span>
        <h2 className="card-title">Interactive Architecture Graph</h2>
        <span className="card-subtitle">{nodeCount} modules</span>
      </div>

      {/* Controls */}
      <div className="graph-controls">
        <button className="graph-btn" onClick={handleFit}>
          <span className="icon icon-sm">{Icons.refreshCw}</span> Reset View
        </button>
        <div className="graph-legend">
          <span className="legend-item"><span className="legend-dot" style={{ background: "#6366f1" }} /> Module</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "#34d399" }} /> Selected</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "#fbbf24" }} /> Neighbor</span>
          <span className="legend-item"><span className="legend-dot" style={{ background: "#f87171" }} /> Cycle</span>
        </div>
      </div>

      {/* Graph container */}
      <div className="cytoscape-container" ref={containerRef} />

      {/* Node details panel */}
      {selectedNode && (
        <div className="node-details">
          <div className="node-details-header">
            <span className="icon icon-sm" style={{ color: "var(--success)" }}>{Icons.package}</span>
            <strong>{selectedNode.id}</strong>
          </div>
          <div className="node-details-meta">
            <span className="badge badge-info">{selectedNode.edgeCount} connections</span>
            <span className="badge badge-success">{selectedNode.dependencies.length} neighbors</span>
          </div>
          {selectedNode.dependencies.length > 0 && (
            <div className="node-deps-list">
              {selectedNode.dependencies.slice(0, 8).map((dep, i) => (
                <span key={i} className="node-dep-tag">{dep.split(/[/\\]/).pop()}</span>
              ))}
              {selectedNode.dependencies.length > 8 && (
                <span className="node-dep-tag">+{selectedNode.dependencies.length - 8} more</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
