import axios from "axios";

const http = axios.create({
    // baseURL: "http://192.168.3.74/WotAfrica/api/",
    // baseURL: "http://192.168.3.74/react_app/code"
    // baseURL: "http://1.6.98.141/mobile/well4life/api/v1"
    // baseURL: "http://1.6.98.142:3000/user"
    // baseURL: "https://us-central1-videostream-5d663.cloudfunctions.net/app"
    // baseURL: "https://world-sport-action-socket.appspot.com"
    // baseURL: "http://13.237.1.133:8085"
    // baseURL: "http://192.168.3.252:3000"
    // baseURL: "http://192.168.1.103:4000"
    // baseURL: "http://192.168.31.99:4000"
    // baseURL: "https://world-sport-action-socket.appspot.com"
    baseURL: "https://registration-api-dev.worldsportaction.com",
    // baseURL: "http://ec2-54-79-5-68.ap-southeast-2.compute.amazonaws.com:8089"
    // baseURL: "http://192.168.31.141:5000"
});

http.interceptors.request.use(function (config) {
    const token = localStorage.token;
    if (token) {
        config.headers.Authorization = token;
    }
    return config;
});

export default http;
