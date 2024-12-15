/*
Copyright 2024 Marcel Domke

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
    function ReolinkAlarmNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const server = RED.nodes.getNode(config.server);
        node.updateTimeout = null;

        // Update status
        async function updateStatus() {
            try {
                node.status(server.connectionStatus);
            } catch (error) {
                node.status({ fill: "red", shape: "ring", text: `Error: Config Node` });
            }

            // Set timeout to call updateStatus again
            node.updateTimeout = setTimeout(updateStatus, 2000);
        }

        node.on('input', async function (msg) {
            if (Number.isInteger(msg.payload)) {
                if (msg.payload < 10 && msg.payload > 0) {
                    try {
                        requestBody = JSON.stringify([
                            {
                                "cmd": "AudioAlarmPlay",
                                "action": 0,
                                "param": {
                                    "alarm_mode": "times",
                                    "times": msg.payload,
                                    "channel": 0
                                }
                            },
                        ]);
                        await server.queryCommand("AudioAlarmPlay", requestBody);
                    } catch (error) {
                        console.warn("Error during query: ", error.message);
                        node.status({ fill: "red", shape: "ring", text: `Error: Send failed` });
                    }
                }
            }
        });

        // Start first update
        updateStatus();

        node.on("close", () => {
            if (node.updateTimeout) {
                clearTimeout(node.updateTimeout);
            }
        });

    }

    RED.nodes.registerType("reolink-alarm", ReolinkAlarmNode);
};
