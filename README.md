## Introduction

TripLogger is a travel forum website dedicated to providing a user-friendly and visually appealing platform for travel enthusiasts. It allows users to easily search for articles using keywords and explore articles on a map. In addition, TripLogger features a self-designed news feed algorithm that enhances the user experience by recommending personalized content based on their preferences and behavior. You can also effortlessly share your travel experiences on this forum and engage in discussions with fellow readers.

## Table of Contents

-   [Tech Stacks](#tech-stacks)
-   [Website](#website)
-   [Features](#features)
-   [Database Schema](#database-schema)
-   [Architecture](#architecture)
-   [Contact](#contact)

## Tech Stacks

-   **Environment and Frameworks:** Node.js, Express, React
-   **Database**: MongoDB Atlas, Redis, Elasticsearch
-   **Cloud**: AWS EC2, ElastiCache, CloudFront, S3
-   **Others**: Socket.IO, RabbitMQ, Docker

## Website

URL: https://chiaproject.com

User1

-   email: triplogger1@gmail.com

-   password: triplogger

User2

-   email: triplogger2@gmail.com

-   password: triplogger

## Features

### User Interaction Tracking

User’s views, likes, saves, and comments will be recorded in database and converting these into post scores and user preference score by scheduled algorithm worker.

### News Feed Algorithm

News feed on TripLogger is generated by a content ranking algorithm inspired by **EdgeRank**,
leveraging **user interactions** to calculate article popularity, applying a **time decay factor**, and
incorporating **user preferences** to deliver customized news feeds.

$$Σ((x_p*w_p*+x_n*w_n)*b_x)*d*l*t $$

x<sub>p</sub>: Previous read, like ,save or comment numbers

x<sub>b</sub>: New read, like ,save or comment numbers

w<sub>p</sub>: Previous interactions weight

w<sub>n</sub>: New interactions weight

b<sub>x</sub>: Interaction boosts of new read, like ,save or comment

d: Time decay e<sup>(k\*(▵t/f))</sup>

    k: time decay constant
    ▵t: time difference between post's last interaction time and current time
    f: score update frequency

l: User location preference score

t: User type preference score

Try to change user’s location and type preference will trigger news feed generation sorting base on present posts scores.

### Caching and Counters by Redis

Utilize Redis’ sorted set to cache user’s personal news feed and hash is used to store user’s location and type score changes during the time period between algorithm calculation. Redis hash is also used as counters for views, like, save, comment numbers.

### Fanout Functionality by RabbitMQ

Decouple the news feed update process after creating, editing and deleting post by utilizing message queue, then emit the update notification to trigger update of news feed in browser’s localstorage.

### Full-text search by Elasticsearch

Utilize Elasticsearch to search across all articles on the website and use Simplified and Traditional Chinese converter plugin to increase accuracy of Chinese analysis.

### Real-time Notifications by Socket.IO

Socket.IO is used to send new comment notifications to author and trigger browsers to fetch updated news feeds every time new news feed generated.

### AWS S3 and CloudFront

Utilized AWS S3 buckets to store static website and images. Integrate it with CloudFront CDN to enhance loading speed.

### Front-end Development

Built the front-end using React with React Hooks and integrated Leaflet map for articles navigation and users’ travel footprint recording.

## Database Schema

### MongoDB

![MongoDB](https://triplogger.s3.ap-northeast-1.amazonaws.com/readme/mongodb.png)

### Elasticsearch

![Elasticsearch](https://triplogger.s3.ap-northeast-1.amazonaws.com/readme/es.png)

## **Architecture**

![Architecture](https://triplogger.s3.ap-northeast-1.amazonaws.com/readme/architecture.png)

## Contact

Linkedin: [https://www.linkedin.com/in/chiachien-li/](https://www.linkedin.com/in/chiachien-li/)

Email: [chiachienli12@gmail.com](mailto:chiachienli12@gmail.com)
