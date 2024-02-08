import React from "react";
import Plot from "react-plotly.js";

export default function LimeView({response}){
    let chartX = [], chartY = [], colorBar = []
    response?.visualizationData.map( array => {
      chartX.push(array[1])
      chartY.push(array[0])
    })
    response?.visualizationData.map( array => {
        colorBar.push( array[1] < 0 ? "#e74c3c" : "#2980b9")
    })

    return(
        <>
        <div style={{wordWrap: "break-word", textAlign: "left"}}>
            <p>Sample: {response?.sample}</p>
            <br></br>
            <p>Prediction: {response?.prediction}</p>
            <br></br>
        </div>
            <Plot
                data={[
                    {
                        type: 'bar',
                        x: chartX,
                        y: chartY,
                        orientation: 'h',
                        marker: {
                            color: colorBar
                        },

                    }
                ]}
                layout={{
                    autosize: false,
                    margin: {
                        l: 50,
                        r: 50,
                        b: 50,
                        t: 50
                    },
                    yaxis: {
                        automargin: true,
                    },
                    width: 1200,
                    height: chartY.length * 30,
                }
                }>
            </Plot>
        </>
    )
}