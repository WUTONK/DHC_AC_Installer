import { DefaultApi,Configuration } from "../api";

export const Api = new DefaultApi(new Configuration({
    basePath: "http://localhost:8080"
}))
