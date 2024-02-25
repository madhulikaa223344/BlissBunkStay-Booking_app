// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [ "./index.html"," ./src/**/*.{html,js,ts,jsx,tsx}"],
//   theme: {
//     extend: {},
//     container:{
//       padding:"10rem",
//     }
//   },
//   plugins: [],
// }
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
    container: {
      padding: {
        md: "10rem",
        sm:"auto",
      },
    },
  },
  plugins: [],
};
