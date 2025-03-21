export interface MultimediaContent {
    map(arg0: (item: MultimediaContent) => Promise<{ 
        localUrl: string | null; 
        id_device_content: number; 
        id_content: number; 
        content: string; 
        url_content: string; 
        play_beginning_date: Date; 
        play_end_date: Date; 
        position_in_carousel: number; 
        hour: number; 
        minute: number; 
        seconds: number; 
        rotation: number; 
    }>): any;
    localUrl: any;
    id_device_content: number,
    id_content: number,
    content: string,
    url_content: string,
    play_beginning_date: Date,
    play_end_date: Date,
    position_in_carousel: number,
    hour: number,
    minute: number,
    seconds: number,
    rotation: number
}

export interface Summary {
    id: number,
    password: string,
    description: string,
    organization: string,
    business_unity: string,
    area: string,
    type: string
}

export interface DeviceData {
    summary: Summary,
    content: MultimediaContent,
}