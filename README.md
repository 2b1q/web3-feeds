## Firebase Cloud Function - RSS Feed Proxy

### Setup

1. Clone the repository:
   ```sh
   git clone git@github.com:2b1q/web3-feeds.git
   cd web3-feeds
   ```

2. Initialize Firebase project:
   ```sh
   firebase init functions
   ```
   - Choose **TypeScript**
   - Enable ESLint (N)
   - Select your Firebase project

3. Install dependencies:
   ```sh
   cd functions
   npm install
   ```

### Deploy
Deploy the Cloud Function:
   ```sh
   firebase deploy --only functions
   #  set YOUR_API_KEY
   ```

### Usage
Make a request using your API key:
   ```sh
   curl -X GET https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/getAllFeeds \
        -H "Authorization: Bearer YOUR_API_KEY" -s | jq .
   ```
