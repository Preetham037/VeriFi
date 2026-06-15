import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const GeoMap = ({ transactions, onAudit }) => {
  // Fix for leaflet default icons if needed, but we are using CircleMarker which doesn't need icons.
  
  // Filter transactions that have coordinates
  const mappedTransactions = transactions.filter(t => t.latitude != null && t.longitude != null);

  return (
    <div className="bg-[#11131A] rounded-2xl border border-gray-800/50 overflow-hidden" style={{ height: '70vh', width: '100%' }}>
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#11131A' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {mappedTransactions.map((txn) => {
          const isFraud = txn.is_fraud;
          return (
            <CircleMarker
              key={txn.id}
              center={[txn.latitude, txn.longitude]}
              radius={isFraud ? 8 : 4}
              fillColor={isFraud ? "#EF4444" : "#10B981"}
              color={isFraud ? "#B91C1C" : "#059669"}
              weight={1}
              opacity={0.8}
              fillOpacity={isFraud ? 0.8 : 0.5}
            >
              <Popup className="bg-[#1A1C23] border border-gray-700 text-white !rounded-lg !p-0">
                <div className="p-3">
                  <h3 className={`font-bold mb-1 ${isFraud ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isFraud ? '⚠️ Fraud Detected' : '✅ Normal Transaction'}
                  </h3>
                  <p className="text-sm text-gray-300">Amount: ₹{txn.amt}</p>
                  <p className="text-sm text-gray-300">Distance: {txn.distance} km</p>
                  <p className="text-sm text-gray-300">Time: {new Date(txn.timestamp).toLocaleTimeString()}</p>
                  
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAudit(txn.id);
                    }}
                    className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-1.5 px-3 rounded-md transition-colors"
                  >
                    Investigate with AI
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default GeoMap;
