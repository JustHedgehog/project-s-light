import React from "react";
export default function AnchorsView({ html }) {
  var result = JSON.stringify(html.visualizationData)
  result = JSON.parse(result)
  // console.log(html.Alternatives === null)
  // console.log(html.Examples)
  // console.log(Array.isArray(html.Alternatives))
  return (
    <div style={{ paddingBottom: "5px" }}>
      <div
        style={{ margin: "20px" }}
      />
      <p style={{wordBreak: "break-word"}}>Sample: {html?.sample}</p>
      <br></br>
      <p>Prediction: {result?.Prediction}</p>
      <br></br>
      {result.Anchor && <p>Anchor: {result?.Anchor}</p>}
      <br></br>
      <p>Precision: {result?.Precision}</p>
      <br></br>
      <p>Coverage: {result?.Coverage}</p>
      <br></br>
      {result.Examples !== null && Array.isArray(result.Examples) ? 
      <>
        <p>Examples where anchor applies and model predicts {result?.Prediction}:</p>
        <br></br>
        {Array.isArray(result.Examples) ? result.Examples.map(example => <p>{example}</p>) : null}
      </> : null}
      <br></br>
      {result.Alternatives !== null && Array.isArray(result.Alternatives) ? 
      <>
        <p>Examples where anchor applies and model predicts alternative:</p>
        <br></br>
        {Array.isArray(result.Alternatives) ? result.Alternatives?.map(alternative => <p>{alternative}</p>) : null}
      </> : null}
      <br></br>
      {result.Visualization && <img src={`data:image/png;base64,${result.Visualization}`}></img>}
    </div>
  );
}