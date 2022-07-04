# Loadify API

## Loadify is a place to download YouTube Videos

This contains the documentation for the endpoints with required paramters.

-   `Headers`: Additional headers required, excluding the `Content-Type`, so if its shown as `none` then ignore
-   `Params` : Params is passed as path. eg: `/api/download/id`, here the `id` is the params
-   `Query` : Query is passed to the url followed by `?name=value`. Query are URL-Encoded, mostly the http client you will be using should do the job.
-   `Method` : The REST HTTP method that should be used to send the request. ranges from `POST`, `GET` , `PUT`, `PATCH`, `DELETE`
-   `Body` : The request body

---

## Youtube Endpoints

The following are the youtube downloading endpoints

### Get video details endpoint

```
/api/yt/details
```

**Method** : GET

**Headers** : none

**Params** : none

**Query**

| Name of query |  Type  |         Description          | Required |
| :-----------: | :----: | :--------------------------: | :------: |
|     `url`     | String | The url of the youtube video |   Yes    |

---

### Get Video file of youtube video

```
/api/yt/download/video/mp4
```

**Method** : GET

**Headers** : none

**Params** : none

**Query**

|  Name of query  |  Type  |                              Description                               | Required |
| :-------------: | :----: | :--------------------------------------------------------------------: | :------: |
|      `url`      | String |                      The url of the youtube video                      |   Yes    |
| `video_quality` | String | the quality of the video. Available values are `Low`, `Medium`, `High` |   Yes    |

---

### Get Audio file of youtube video

```
/api/yt/download/audio/mp4
```

**Method** : GET

**Headers** : none

**Params** : none

**Query**

| Name of query |  Type  |         Description          | Required |
| :-----------: | :----: | :--------------------------: | :------: |
|     `url`     | String | The url of the youtube video |   Yes    |
