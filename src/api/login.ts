import API from "./axios"
import { ENDPOINT_LOGIN } from "../utils/config"

const login = async (password: string) => {
    const response = await API.get(`${ENDPOINT_LOGIN}${password}`)
    return response.data
}

export default login