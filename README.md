# Reolink Integration for Node-RED

An unofficial Node-RED integration for Reolink cameras that allows you to receive motion detection and AI events, trigger alarms, and control the integrated LED or siren.

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

4. **Reolink Siren Node**  
   This node controls and monitors the state of the audio alarm (siren) on the camera. If activated the siren will sound when motion is detected.

5. **Reolink LED Control Node**  
   This node controls the white LED light of the camera and queries its status.

6. **Reolink PTZ Patrol Node**  
   This node allows you to control the PTZ (Pan-Tilt-Zoom) patrol function on a Reolink device. When activated, the camera will follow a pre-configured patrol pattern.  

7. **Reolink PTZ Preset Node**  
   This node controls and queries the PTZ (Pan-Tilt-Zoom) preset positions on a Reolink device. You can either set the camera to a specific preset position or retrieve a list of available preset positions from the device.  

8. **Reolink IR Light Node**  
   This node allows you to control and monitor the mode of the IR (infrared) LED light on a Reolink device.

## Compatibility

Tested with the following Reolink cameras:
- Reolink RLC-823S2
- Reolink RLC-1224A
- Reolink CX410
- Reolink CX810 (by k5map)

But this integration should work with all Reolink cameras that support the HTTP / HTTPS API.

## License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
