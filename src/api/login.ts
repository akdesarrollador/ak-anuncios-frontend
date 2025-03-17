import API from "./axios"
import { ENDPOINT_LOGIN } from "../utils/config"

const login = async (password: string) => {
    console.log(`login function called in axios. url: ${ENDPOINT_LOGIN}${password}`)
    const response = await API.get(`${ENDPOINT_LOGIN}${password}`)
    console.log(`response from axios login: ${response}`)
    return response.data
}

export default login