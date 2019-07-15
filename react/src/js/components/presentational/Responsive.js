import React from "react";
import Responsive from 'react-responsive';

export const Desktop = props => <Responsive {...props} minDeviceWidth={1224} />;
export const Tablet = props => <Responsive {...props} minDeviceWidth={768} maxDeviceWidth={1223} />;
export const Mobile = props => <Responsive {...props} maxDeviceWidth={767} />;