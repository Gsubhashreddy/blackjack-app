When validating UI changes in this repository, prefer automated checks over screenshots:

- Run `npm run lint`, `npm test`, and `npm run build` for verification.
- Do not use image/screenshot inspection as a required validation step.
- Avoid opening or attaching temporary PNG/JPEG files from `/tmp` in agent responses.
