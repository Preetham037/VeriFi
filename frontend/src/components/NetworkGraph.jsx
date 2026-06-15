import React, { useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

const NetworkGraph = ({ transactions }) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const graphData = useMemo(() => {
    const nodes = [];
    const links = [];
    
    // Add nodes
    transactions.forEach(t => {
      nodes.push({
        id: t.id,
        val: t.is_fraud ? 3.5 : 1,
        color: t.is_fraud ? '#EF4444' : '#10B981',
        name: `Txn #${t.id} - ${t.is_fraud ? 'FRAUD' : 'GENUINE'} (₹${t.amt})`
      });
    });

    // Add synthetic links for demo purposes (mimicking shared IPs/Devices)
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const t1 = transactions[i];
        const t2 = transactions[j];
        
        let linkStrength = 0;
        
        // Both fraud = strong link
        if (t1.is_fraud && t2.is_fraud) {
            linkStrength += 2;
        }
        
        // Similar amount
        if (Math.abs(t1.amt - t2.amt) < 50) {
            linkStrength += 1;
        }
        
        // Same channel
        if (t1.is_online === t2.is_online) {
            linkStrength += 0.5;
        }
        
        // Create link if strength is high enough
        if (linkStrength >= 2.5) {
            links.push({
                source: t1.id,
                target: t2.id,
                color: 'rgba(239, 68, 68, 0.4)' // Reddish link for fraud rings
            });
        } else if (linkStrength >= 1.5 && (!t1.is_fraud || !t2.is_fraud) && Math.random() > 0.95) {
             links.push({
                source: t1.id,
                target: t2.id,
                color: 'rgba(156, 163, 175, 0.2)' // Grayish link for normal connections
            });
        }
      }
    }

    return { nodes, links };
  }, [transactions]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '600px', backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeColor="color"
        nodeVal="val"
        linkColor="color"
        linkWidth={1.5}
        backgroundColor="#0F172A"
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};

export default NetworkGraph;
