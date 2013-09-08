Project HashBrown
=========


Tested APIs:
=========


Control & Heirarical Management:
=========

1. Login:
http://localhost:3000/login
```JSON
{
	"username": "god",
	"password" : "123"
}
```

2. Create an organization (also creates a user e.g. 'org1'):
http://localhost:3000/user
```JSON
{
	"request":"createorg",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "name": "org1",
	        "dbConnection":"mongodb://localhost",
	        "dbName": "org1",
	        "hash": "123",
	        "kingdoms": ["winterfell"]
	}
}
```

3. Add users to your organization (login via user org1):
http://localhost:3000/users
```JSON
{
	"request":"add",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "username": "org1u1",
	        "password": "123"
	}
}
```

4. Promote user:
http://localhost:3000/users
```JSON
{
	"request":"promote",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "username": "u1@org1",
	        "permission": "admin"
	}
}
```

5. Grant kingdom permissions to a user:
http://localhost:3000/users
```JSON
{
	"request":"grant",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "username": "u1@org1",
	        "permission": "admin",
	        "kingdom": "winterfell"
	}
}
```

5. Revoke kingdom permissions to a user:
http://localhost:3000/users
```JSON
{
	"request":"revoke",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "username": "u1@org1",
	        "permission": "access",
	        "kingdom": "winterfell"
	}
}
```

6. Re-associate a user to a different parent:
http://localhost:3000/users
```JSON
{
	"request":"reassociate",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "username": "org1u1",
	        "newParent": "u1@org1"
	}
}
```

7. Delete a user:
http://localhost:3000/users
```JSON
{
	"request":"delete",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "username": "u2@org1"
	}
}
```

8. Create a team:
http://localhost:3000/user
```JSON
{
	"request":"addteam",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "parent": "t1@org1",
	        "name": "t7@org1",
	        "dbName": "team1",
	        "dbConnection": "mongodb://localhost"
	}
}
```

9. Add a user to a team:
http://localhost:3000/team
```JSON
{
	"request":"adduser",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "name": "u2@org1",
	        "team": "t1@org1"
	}
}
```

10. Change a team's owner:
http://localhost:3000/team
```JSON
{
	"request":"changeowner",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "name": "u2@org1",
	        "team": "t4@org1"
	}
}
```

11. Get the whole team structure, perhaps the first thing to be called before any mgmt APIs:
http://localhost:3000/team
```JSON
{
	"request":"getallusers",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "team": "t2@org1"
	}
}
```

Winterfell APIs:
=========

1. Create a feed
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"newfeed",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "content": "blahblah4",
	        "belongs": ["t1@org1"],
	        "tags": ["first", "second"],
	        "private": true,
	        "mentions": ["god"],
	        "versioned": true
	}
}
```

2. Check-in a feed
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"checkinfeed",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "content": "blahblah666",
	        "belongs": ["t1@org1"],
	        "tags": ["first", "second"],
	        "private": true,
	        "mentions": ["god"],
	        "versioned": true,
	        "name": "wee",
	        "historyId": "/God/god/wee"
	}
}
```
3. Check-out a feed
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"checkoutfeed",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/God/god/wee"
	}
}
```

4. Request a pull for the feed:
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"pullrequest",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/God/god/test"
	}
}
```

5. Accept a pull request:
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"acceptpull",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/God/god/test",
	        "number": "2"
	}
}
```

6. Reject a pull request:
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"rejectpull",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/God/god/oo",
	        "number": 0
	}
}
```

7. Get this user's history with this feed
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"gethistory",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/God/god/oo"
	}
}
```

8. Get all history of this feed
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"getfullhistory",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/God/god/wee"
	}
}
```


Response schema validator:
=========


```Javascript
var resultConstructorValidatorSchema = {
    "id": "/resultConstructorValidatorSchema",
    "type": "object",
    "properties": {
        "request": { "type": "string", "required": "true" },
        "uuid": { "type": "string", "required": "true" },
        "success": { "type": "boolean", "required": "true" },
        "msg": { "anyOf": [
                {
                    "description": "object"
                },
                {
                    "description": "string"
                }
            ]
        }
    }
};
```


P.S.
Every feed has "uuid" field which can be used by frontend to verify the response.

More to test, especially feeds and feed history
In case any other APIs are needed, create an issue on github - better way to track what we do.
