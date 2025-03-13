import axios from "axios"
import { BACKEND_ROOT } from "../utils/config"

const API = axios.create({
     baseURL: BACKEND_ROOT,
     headers: {
          "Content-Type": "application/json",
     },
})

export default API