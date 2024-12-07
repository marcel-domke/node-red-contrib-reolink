# Reolink Integration for Node-RED

An unofficial Node-RED integration for Reolink cameras that allows you to receive motion detection and ai events, trigger alarms, and control the integrated LED.

## Usage

### Configuration Node

The **Reolink Device** node allows you to configure the connection to your Reolink camera and share it between the nodes. 


### Nodes

1. **Reolink AI Event Node**  
   This node queries the AI events from the Reolink camera (e.g., person recognition, vehicle detection).

2. **Reolink Motion Detection Node**  
   This node receives motion detection events from the camera.
   
3. **Reolink Alarm Node**  
   This node triggers an alarm on the camera.
   
4. **Reolink LED Control Node**  
   This node controls the white LED light of the camera and queries its status.

## Compatibility

Tested with the following Reolink cameras:
- Reolink RLC-823S2
- Reolink RLC-1224A
- Reolink CX410

But this integration should work with all Reolink cameras that support the HTTP API.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.

