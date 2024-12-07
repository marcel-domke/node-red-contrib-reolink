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
    function ReolinkAiEventNode(config) {
        RED.nodes.createNode(this, config);

        const node = this;
        const server = RED.nodes.getNode(config.server);
        node.queryTimeout = null;

        // Fetch data and send to output
        async function queryStates() {
            try {
                const aiStates = await server.queryCommand("GetAiState");
                if (aiStates) {
                    node.send({
                        payload: aiStates
                    });
                }
                node.status(server.connectionStatus);
            } catch (error) {
                console.warn("Error during query: ", error.message);
                node.status({ fill: "red", shape: "ring", text: `Error: Query failed` });
            }

            // Set timeout to call queryStates again
            node.queryTimeout = setTimeout(queryStates, 2000);
        }

        // Start first query
        queryStates();

        node.on("close", () => {
            if (node.queryTimeout) {
                clearTimeout(node.queryTimeout);
            }
        });
    }

    RED.nodes.registerType("reolink-ai-event", ReolinkAiEventNode);
};
