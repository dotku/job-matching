import requests
from bs4 import BeautifulSoup

# URL to be scraped
url = 'https://app.draftboard.com/boards/public/7wG3ERd?name=All%20Jobs'

# Send a GET request to the URL
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Parse the HTML content using BeautifulSoup
    soup = BeautifulSoup(response.content, 'html.parser')

    # Extract content (you need to adjust the selectors based on the actual page structure)
    content = soup.find_all('li', {'role': 'listitem', 'class': 'group mb-3 cursor-pointer rounded-lg shadow-lg hover:shadow-lg md:mb-0 md:shadow-none'})  # Replace 'some-class-name' with the actual class name
    # print(content)
    # Print or process the extracted content
    for item in content:
        print(item.text)

else:
    print(f"Failed to retrieve the page. Status code: {response.status_code}")
