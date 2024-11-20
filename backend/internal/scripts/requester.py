import requests
import csv

class Requester:
    def __init__(self, base_url=""):
        self.base_url = self.set_base_url(base_url)
        self.session_name = ""
        self.session_token = ""
        self.session = requests.Session()
        self.me = None

    def set_base_url(self, base_url):
        if type(base_url) != str:
            raise ValueError("base_url must be a string")
        if base_url[-1] == "/":
            base_url = base_url[:-1]
        self.base_url = base_url
        return self.base_url
    def get_url(self, url):
        if type(url) != str:
            raise ValueError("url must be a string")
        if self.base_url == "":
            raise ValueError("base_url is not set")
        if url[0] != "/":
            url = "/" + url
        if url[-1] == "/":
            url = url[:-1]
        return self.base_url + url

    def set_session_name(self, session_name):
        if type(session_name) != str:
            raise ValueError("session_name must be a string")
        self.session_name = session_name
        return self.session_name
    def set_session_token(self, session_token):
        if type(session_token) != str:
            raise ValueError("session_token must be a string")
        self.session_token = session_token
        return self.session_token
    def get_cookie(self):
        return {self.session_name: self.session_token}

    def login(self, username, password):        
        url = self.get_url("/session/")
        if type(username) != str:
            raise ValueError("username must be a string")
        if type(password) != str:
            raise ValueError("password must be a string")
        payload = {
            "user_name": username,
            "password": password
        }
        initial_request = self.session.post(url, json=payload)
        if initial_request.status_code != 200:
            print("Failed to login")
            print("response :", initial_request.json())
            return
        token = initial_request.cookies[self.session_name]
        if token == None:
            print("cookie :", initial_request.cookies)
            print("Failed to get session token")
            return
        self.set_session_token(token)
        print("Successfully logged in")
        print(f"\tsession \"{self.session_name}\" set to \"{token}\"")
    def logout(self):
        url = self.get_url("/session/")
        headers = {}
        request = self.session.delete(url, headers=headers, cookies=self.get_cookie())
        if request.status_code != 200:
            print("Failed to logout")
            print("response:", request.json())
            return
        self.me = None
        self.set_session_token("")
        print("Successfully logged out")
    def user_me(self):
        url = self.get_url("/user/me/")
        headers = {}
        request = self.session.get(url, headers=headers, cookies=self.get_cookie())
        if request.status_code != 200:
            print("Failed to get user")
            print("response:", request.json())
            return
        print("User:", request.json()) 
        self.me = request.json().get("id")
        return self.me

    def create_user(self, user_name, real_name, password, email, institution_id, overview):
        url = self.get_url("/user/")
        if type(user_name) != str:
            raise ValueError("user_name must be a string")
        if type(real_name) != str:
            raise ValueError("real_name must be a string")
        if type(password) != str:
            raise ValueError("password must be a string")
        if type(email) != str:
            raise ValueError("email must be a string")
        if type(institution_id) != int:
            raise ValueError("institution_id must be an integer")
        if type(overview) != str:
            raise ValueError("overview must be a string")
        payload = {
            "user_name": user_name,
            "real_name": real_name,
            "password": password,
            "email": email,
            "institution_id": institution_id,
            "overview": overview
        }
        try : 
            request = self.session.post(url, json=payload, cookies=self.get_cookie())
            if request.status_code != 200:
                print("Failed to create user")
                print("status code:", request.status_code)
                print("response:", request.json())
                return
            print("User created")
            print("\tresponse:", request.json())
            return request.json().get("id")
        except Exception as e:
            print("Failed to create user")
            print("exception:", e)
            return 0
    def create_participant(self, competition_id):
        url = self.get_url(f"/participant/")
        if type(competition_id) != int:
            raise ValueError("competition_id must be an integer")
        if type(self.me) != int:
            raise ValueError("user_id must be an integer")
        if competition_id <= 0:
            print("Invalid competition id")
            return
        if self.me <= 0:
            print("User not logged in")
            return
        payload = {
            "user_id": self.me,
            "competition_id": competition_id,
            "role": "Player"
        }
        try : 
            request = self.session.post(url, json=payload, cookies=self.get_cookie())
            if request.status_code != 200:
                print("Failed to create participant")
                print("status code:", request.status_code)
                print("response:", request.json())
                return
            print("Participant created")
            print("\tresponse:", request.json())
            return request.json().get("id")
        except Exception as e:
            print("Failed to create participant")
            print("exception:", e)
            return 0

def read_user_csv(csv_path, competition_id):
    """
    the csv file be like
    real_name, password, target
    """
    if type(csv_path) != str:
        raise ValueError("csv_path must be a string")
    if type(competition_id) != int:
        raise ValueError("competition_id must be an integer")
    file = open(csv_path, mode='r', encoding='utf-8')
    if file.closed:
        print ("File is closed")

    csv_reader = csv.reader(file)
    user_data = []
    for row in csv_reader:
        user_data.append({
            "real_name": row[0],
            "password": row[1],
            "user_name": f"{row[2]}{competition_id}",
            "email": row[2],
            "institution_id": 1,
            "overview": row[2]
        })
    file.close()
    return user_data

if __name__ == "__main__":
    base_url = "http://127.0.0.1:80/api"
    session_name = "mysession"
    ### You need to change the following variables
    csv_path = "data.csv"
    competition_id = 1
    ### You need to change the variables above
    
    ## expect the csv file to have the following columns in the following order
    ## real_name, password, target
    """
    And this program should transform the csv file into the following data structure
    user_data = {
        "real_name": "real name",
        "password": "password",
        "user_name": "target||competition_id",
        "email": "target",
        "institution_id": 1,
        "overview": "target"
    }
    """
    
    ## setup requester
    requester = Requester(base_url)
    requester.set_session_name(session_name)
    
    user_data = read_user_csv(csv_path, competition_id)
    
    for user in user_data:
        print(user)
        ## create users 
        user_id = requester.create_user(**user)
        
        ## login as other user to create participant
        requester.login(user["user_name"], user["password"])
        requester.user_me()
        requester.create_participant(competition_id)
        requester.logout()