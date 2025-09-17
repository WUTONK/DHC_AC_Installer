import { DefaultApi,Configuration } from "../api";

export const Api = new DefaultApi(new Configuration({
    basePath: "http://127.0.0.1:19810"
}))
