// The design-system bundle is a classic script that reads React from window.
// This module must be imported before ./bundle.js (see ./index.ts).
import React from 'react';
import ReactDOM from 'react-dom';

const w = window as unknown as { React: typeof React; ReactDOM: typeof ReactDOM };
w.React = React;
w.ReactDOM = ReactDOM;
