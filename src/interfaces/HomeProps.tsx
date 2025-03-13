interface Content {
    id_device_content: number,
    id_content: number,
    content: string,
    url_content: string,
    play_beginning_date: Date,
    play_end_date: Date,
    position_in_carousel: number,
    hour: number,
    seconds: number,
    rotation: number
}

interface DeviceParams {
    id: number,
    organization: string,
    business_unity: string,
    area: string
}

interface HomeProps {
    content: Content[];
    deviceParams: DeviceParams;
}

export default HomeProps