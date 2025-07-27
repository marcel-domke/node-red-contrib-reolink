/*
Copyright 2025 Marcel Domke

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

module.exports = function (RED) {
    function ReolinkIrLightNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const server = RED.nodes.getNode(config.server);
        node.queryTimeout = null;
        node.lastState = null;

        // Fetch data and send to output
        async function queryStates() {
            try {
                let requestBody = JSON.stringify([
                    {
                        "cmd": "GetIrLights",
                    },
                ]);
                const data = await server.queryCommand("GetIrLights", requestBody);
                if (data) {
                    ledState = data[0].value.IrLights.state;
                    if (ledState != node.lastState) {
                        node.send({
                            payload: ledState,
                            topic: config.topic || server.name
                        });
                        node.lastState = ledState
                        node.status({
                            fill: server.connectionStatus.fill,
                            shape: server.connectionStatus.shape,
                            text: server.connectionStatus.text + " | " + ledState
                        });
                    }
                }
                else {
                    node.status(server.connectionStatus);
                }

            } catch (error) {
                console.warn("Error during query: ", error.message);
                node.status({ fill: "red", shape: "ring", text: `Error: Query failed` });
            }

            // Set timeout to call queryStates again
            node.queryTimeout = setTimeout(queryStates, config.interval * 1000 || 2000);
        }

        // Start first query
        queryStates();

        node.on('input', async function (msg) {
            if (msg.payload == "Auto" || msg.payload == "Off") {
                try {
                    let requestBody = JSON.stringify([
                        {
                            "cmd": "SetIrLights",
                            "action": 0,
                            "param": {
                                "IrLights": {
                                    "channel": 0,
                                    "state": msg.payload
                                }
                            }
                        },
                    ]);
                    await server.queryCommand("SetIrLights", requestBody);
                } catch (error) {
                    console.warn("Error during query: ", error.message);
                    node.status({ fill: "red", shape: "ring", text: `Error: Send failed` });
                }
            }


        });

        node.on("close", () => {
            if (node.queryTimeout) {
                clearTimeout(node.queryTimeout);
            }
        });
    }

    RED.nodes.registerType("reolink-ir-light", ReolinkIrLightNode);
};
