import React from "react";
export default function ShapView({ html }) {
  return (
    <div style={{ paddingBottom: "5px" }}>
      <div style={{wordWrap: "break-word", textAlign: "left"}}>
            <p>Sample: {html?.sample}</p>
            <br></br>
            <p>Prediction: {html?.prediction}</p>
            <br></br>
        </div>
      <div
        style={{ margin: "20px" }}
        dangerouslySetInnerHTML={{
          __html:
            '<?xml version="1.0" encoding="iso-8859-1"?>' + html?.visualizationData + "</xml>",
        }}
      />
    </div>
  );
}
