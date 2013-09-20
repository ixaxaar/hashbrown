Project HashBrown
=========


Tested APIs:
=========


Control & Hierarchical Management:
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
Response:
```JSON
{
    request: "createorg"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
       useruid: "org1"
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
	        "username": "u2@org1",
	        "password": "123"
	}
}
```
Response:
```JSON
{
    request: "add"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
       uid: "u2@org1"
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
Response:
```JSON
{
    request: "promote"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
        uid: "u1@org1"
        permission: 16
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
Response:
```JSON
{
    request: "grant"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
        uid: "u1@org1"
    }
}
```

6. Revoke kingdom permissions to a user:
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
Response:
```JSON
{
    request: "grant"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
        uid: "u1@org1"
    }
}
```


7. Re-associate a user to a different parent:
http://localhost:3000/users
```JSON
{
    "request":"reassociate",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "username": "u1@org1",
            "newParent": "u2@org1"
    }
}
```
Response:
```JSON
{
    request: "reassociate"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
        uid: "u1@org1"
        parent: "u2@org1"
    }
}
```

8. Delete a user:
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
Response:
```JSON
{
    request: "delete"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
       uid: "u1@org1"
    }
}
```

9. Create a team:
http://localhost:3000/user
```JSON
{
	"request":"addteam",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "parent": "",
	        "name": "t1@org1",
	        "dbName": "team1",
	        "dbConnection": "mongodb://localhost"
	}
}
```
Response:
```JSON
{
    request: "addteam"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
        useruid: "org1"
        teamname: "t1@org1"
    }
}
```

10. Add a user to a team:
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
```JSON
{
    request: "adduser"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: false
    msg: {
        useruid: [4]
        0:  "u2@org1"
        1:  "u3@org1"
        2:  "u4@org1"
        3:  "u1@org1"
    }
}
```

11. Change a team's owner (presently responds with everything, will sort that out...):
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
Response:
```JSON
{
    request: "changeowner"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: "{"__v":0,"_id":"52330c7487f2521279000021","dbConnection":"mongodb://localhost","name":"t3@org1","orgName":"org1","owner":"u1@org1","children":[],"users":[],"dbName":"team3","uuid":"f502e252-94c2-43ff-aa2f-a10782dada2b"}"
}
```

12. Get the whole team structure, perhaps the first thing to be called before any mgmt APIs:
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
```JSON
{
    request: "getallusers"
    uuid: "038b0083-0d58-48a9-b1b2-3d2971e68947"
    success: true
    msg: {
        owner: "org1"
        name: "t1@org1"
        dbConnection: "mongodb://localhost"
        databaseName: "team1"
        users: [4]
                0:  "u2@org1"
                1:  "u3@org1"
                2:  "u4@org1"
                3:  "u1@org1"
        children: [0]
    }
}
```


Winterfell APIs:
=========

1. Create a feed todo:integrate markedown compilation into markup
http://localhost:3000/winterfell/feed
```JSON
{
    "request":"newfeed",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "content": "66666666666666666666666666666666666666666666666666666666666666666666666666666666666666666",
            "belongs": ["t2@org1", "t1@org1"],
            "tags": ["first"],
            "mentions": ["u2@org1"],
            "versioned": true
    }
}
```
Response:
```JSON
{
    success: true
    msg: {
        __v: 0
        versionuid: "/org1/u1@org1/"
        org: "org1"
        owner: "u1@org1"
        _id: "5234cbdec58db2ae2c000017"
        broadcast: false
        associations: [1]
            0:  null
        versioned: true
        children: [0]
        acl: [1]
            0:  "u2@org1"   
        teams: [2]
            0:  "t2@org1"
            1:  "t1@org1"
        tags: [1]
            0:  {
                _id: "5234cbdec58db2ae2c000019"
                name: "first"
            }
        content: [1]
            0:  {
                description: "66666666666666666666666666666666666666666666666666666666666666666666666666666666666666666"
                location: ""
                displayname: ""
                mime: ""
                file: ""
                _id: "5234cbdec58db2ae2c000018"
                videoFiles: [0]
            }
        updated: "2013-09-14T20:48:59.397Z"
        created: "2013-09-14T20:48:59.397Z"
        uuid: "8dcb37d7-4568-48e5-a33d-7bd830428f1b"
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
	        "historyId": "/org1/u1@org1/document"
	}
}
```
Response:
```JSON
{
  "success": true,
  "msg": {
    "feed": {
      "__v": 0,
      "versionuid": "/org1/u1@org1/document_version_1",
      "private": true,
      "org": "org1",
      "owner": "u1@org1",
      "_id": "52357f88ba09bbfe36000014",
      "broadcast": false,
      "associations": [
        null
      ],
      "versioned": true,
      "children": [],
      "acl": [
        "god"
      ],
      "teams": [],
      "tags": [
        {
          "_id": "52357f88ba09bbfe36000016",
          "name": "first"
        },
        {
          "_id": "52357f88ba09bbfe36000017",
          "name": "second"
        }
      ],
      "content": [
        {
          "description": "version 1",
          "location": "",
          "displayname": "document_version_1",
          "mime": "",
          "file": "",
          "_id": "52357f88ba09bbfe36000015",
          "videoFiles": []
        }
      ],
      "updated": "2013-09-15T09:25:46.305Z",
      "created": "2013-09-15T09:25:46.305Z",
      "uuid": "c8ebf928-af4c-4af9-99fd-d9b08c629f98"
    },
    "history": {
      "__v": 0,
      "owner": "u1@org1",
      "_id": "52357f88ba09bbfe36000019",
      "versions": [
        0
      ],
      "pullRequests": [],
      "timeline": [
        {
          "_id": "52357f88ba09bbfe36000018",
          "index": 0,
          "action": 2,
          "version": 0,
          "user": "u1@org1",
          "uid": "52357f88ba09bbfe36000014",
          "related": [],
          "changed": "2013-09-15T09:25:46.300Z"
        }
      ],
      "name": "/org1/u1@org1/document_version_1"
    }
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
            "historyId": "/org1/u1@org1/document"
    }
}
```
Response:
```JSON
{
  "request": "checkoutfeed",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "versionuid": "/org1/u1@org1/document",
    "private": true,
    "org": "org1",
    "owner": "u1@org1",
    "_id": "523580a8ba09bbfe3600001a",
    "__v": 0,
    "broadcast": false,
    "associations": [
      null
    ],
    "versioned": true,
    "children": [],
    "acl": [
      "god"
    ],
    "teams": [],
    "tags": [
      {
        "_id": "523580a8ba09bbfe3600001c",
        "name": "first"
      },
      {
        "_id": "523580a8ba09bbfe3600001d",
        "name": "second"
      }
    ],
    "content": [
      {
        "description": "version 1",
        "location": "",
        "displayname": "document",
        "mime": "",
        "file": "",
        "_id": "523580a8ba09bbfe3600001b",
        "videoFiles": []
      }
    ],
    "updated": "2013-09-15T09:25:46.305Z",
    "created": "2013-09-15T09:25:46.305Z",
    "uuid": "c8ebf928-af4c-4af9-99fd-d9b08c629f98"
  }
}
```

4. Get latest version of a document:
http://localhost:3000/winterfell/feed
```JSON
{
    "request":"getlatest",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "historyId": "/org1/u1@org1/document"
    }
}
```
Response:
```JSON
{
  "request": "getlatest",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "versionuid": "/org1/u1@org1/document",
    "private": true,
    "org": "org1",
    "owner": "u1@org1",
    "_id": "5235dce7a28d42ef56000016",
    "__v": 0,
    "broadcast": false,
    "associations": [
      null
    ],
    "versioned": true,
    "children": [],
    "acl": [
      "god"
    ],
    "teams": [],
    "tags": [
      {
        "_id": "5235dce7a28d42ef56000018",
        "name": "first"
      },
      {
        "_id": "5235dce7a28d42ef56000019",
        "name": "second"
      }
    ],
    "content": [
      {
        "description": "version 5",
        "location": "",
        "displayname": "document",
        "mime": "",
        "file": "",
        "_id": "5235dce7a28d42ef56000017",
        "videoFiles": []
      }
    ],
    "updated": "2013-09-15T16:14:06.395Z",
    "created": "2013-09-15T16:14:06.395Z",
    "uuid": "dbf2e3eb-5776-4b62-bbef-47370a41679d"
  }
}
```

5. Request a pull for the feed - creates a request to pull all check-ins by this user 
    from the last accepted check-ed in point:
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
Response:
```JSON
{
  "request": "pullrequest",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 12,
    "_id": "523580a8ba09bbfe3600001f",
    "owner": "u1@org1",
    "versions": [
      0
    ],
    "pullRequests": [
      12
    ],
    "timeline": [
      {
        "_id": "523580a8ba09bbfe3600001e",
        "index": 0,
        "action": 2,
        "version": 0,
        "user": "u1@org1",
        "uid": "523580a8ba09bbfe3600001a",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580aeba09bbfe36000024",
        "index": 1,
        "action": 2,
        "version": 1,
        "user": "u1@org1",
        "uid": "523580aeba09bbfe36000020",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580b6ba09bbfe36000029",
        "index": 2,
        "action": 2,
        "version": 2,
        "user": "u1@org1",
        "uid": "523580b6ba09bbfe36000025",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580bbba09bbfe3600002e",
        "index": 3,
        "action": 2,
        "version": 3,
        "user": "u1@org1",
        "uid": "523580bbba09bbfe3600002a",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580c1ba09bbfe36000033",
        "index": 4,
        "action": 2,
        "version": 4,
        "user": "u1@org1",
        "uid": "523580c1ba09bbfe3600002f",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523585e1ba09bbfe36000038",
        "index": 5,
        "action": 2,
        "version": 5,
        "user": "u1@org1",
        "uid": "523585e1ba09bbfe36000034",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523586c06b2d36823a00001c",
        "index": 6,
        "action": 2,
        "version": 6,
        "user": "u1@org1",
        "uid": "523586c06b2d36823a000018",
        "related": [],
        "changed": "2013-09-15T10:06:30.968Z"
      },
      {
        "_id": "523587316b2d36823a000021",
        "index": 7,
        "action": 2,
        "version": 7,
        "user": "u1@org1",
        "uid": "523587316b2d36823a00001d",
        "related": [],
        "changed": "2013-09-15T10:06:30.968Z"
      },
      {
        "_id": "523587602a05d1d73a000018",
        "index": 8,
        "action": 2,
        "version": 8,
        "user": "u1@org1",
        "uid": "523587602a05d1d73a000014",
        "related": [],
        "changed": "2013-09-15T10:09:32.797Z"
      },
      {
        "_id": "523588c52d7e995d3b000015",
        "action": 1,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [],
        "changed": "2013-09-15T10:13:26.617Z"
      },
      {
        "_id": "5235895f450fc59f3b000015",
        "action": 1,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [],
        "changed": "2013-09-15T10:18:01.829Z"
      },
      {
        "_id": "52358a2f450fc59f3b000017",
        "action": 1,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [],
        "changed": "2013-09-15T10:18:01.829Z"
      },
      {
        "_id": "52358a5e450fc59f3b000019",
        "index": 12,
        "action": 3,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8
        ],
        "changed": "2013-09-15T10:18:01.829Z"
      }
    ],
    "name": "/org1/u1@org1/document"
  }
}
```

6. Accept a pull request:
http://localhost:3000/winterfell/feed
```JSON
{
    "request":"acceptpull",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "historyId": "/org1/u1@org1/document",
            "number": "0"
    }
}
```
```JSON
{
  "request": "acceptpull",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 13,
    "_id": "523580a8ba09bbfe3600001f",
    "owner": "u1@org1",
    "versions": [
      0,
      13
    ],
    "pullRequests": [],
    "timeline": [
      {
        "_id": "523580a8ba09bbfe3600001e",
        "index": 0,
        "action": 2,
        "version": 0,
        "user": "u1@org1",
        "uid": "523580a8ba09bbfe3600001a",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580aeba09bbfe36000024",
        "index": 1,
        "action": 2,
        "version": 1,
        "user": "u1@org1",
        "uid": "523580aeba09bbfe36000020",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580b6ba09bbfe36000029",
        "index": 2,
        "action": 2,
        "version": 2,
        "user": "u1@org1",
        "uid": "523580b6ba09bbfe36000025",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580bbba09bbfe3600002e",
        "index": 3,
        "action": 2,
        "version": 3,
        "user": "u1@org1",
        "uid": "523580bbba09bbfe3600002a",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523580c1ba09bbfe36000033",
        "index": 4,
        "action": 2,
        "version": 4,
        "user": "u1@org1",
        "uid": "523580c1ba09bbfe3600002f",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523585e1ba09bbfe36000038",
        "index": 5,
        "action": 2,
        "version": 5,
        "user": "u1@org1",
        "uid": "523585e1ba09bbfe36000034",
        "related": [],
        "changed": "2013-09-15T09:25:46.300Z"
      },
      {
        "_id": "523586c06b2d36823a00001c",
        "index": 6,
        "action": 2,
        "version": 6,
        "user": "u1@org1",
        "uid": "523586c06b2d36823a000018",
        "related": [],
        "changed": "2013-09-15T10:06:30.968Z"
      },
      {
        "_id": "523587316b2d36823a000021",
        "index": 7,
        "action": 2,
        "version": 7,
        "user": "u1@org1",
        "uid": "523587316b2d36823a00001d",
        "related": [],
        "changed": "2013-09-15T10:06:30.968Z"
      },
      {
        "_id": "523587602a05d1d73a000018",
        "index": 8,
        "action": 2,
        "version": 8,
        "user": "u1@org1",
        "uid": "523587602a05d1d73a000014",
        "related": [],
        "changed": "2013-09-15T10:09:32.797Z"
      },
      {
        "_id": "523588c52d7e995d3b000015",
        "action": 1,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [],
        "changed": "2013-09-15T10:13:26.617Z"
      },
      {
        "_id": "5235895f450fc59f3b000015",
        "action": 1,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [],
        "changed": "2013-09-15T10:18:01.829Z"
      },
      {
        "_id": "52358a2f450fc59f3b000017",
        "action": 1,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [],
        "changed": "2013-09-15T10:18:01.829Z"
      },
      {
        "_id": "52358a5e450fc59f3b000019",
        "index": 12,
        "action": 3,
        "version": null,
        "user": "u1@org1",
        "uid": "",
        "related": [
          0,
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8
        ],
        "changed": "2013-09-15T10:18:01.829Z"
      },
      {
        "_id": "52358b2c450fc59f3b00001c",
        "index": 13,
        "action": 4,
        "version": 1,
        "user": "u1@org1",
        "uid": "",
        "related": [
          12
        ],
        "changed": "2013-09-15T10:18:01.829Z"
      }
    ],
    "name": "/org1/u1@org1/document"
  }
}
```

7. Reject a pull request:
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
Response: Same as 6.


8. Get this user's history with this feed
http://localhost:3000/winterfell/feed
```JSON
{
    "request":"rejectpull",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "historyId": "/org1/u1@org1/document",
            "number": 0
    }
}
```

9. Get all history of this feed
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"getfullhistory",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "historyId": "/org1/u1@org1/document"
	}
}
```
Response:
```JSON
{
  "request": "getfullhistory",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": [
    {
      "_id": "5235a93fbfdda7a64d000018",
      "index": 0,
      "action": 2,
      "version": 0,
      "user": "u1@org1",
      "uid": "5235a93fbfdda7a64d000014",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235a946bfdda7a64d00001e",
      "index": 1,
      "action": 2,
      "version": 1,
      "user": "u1@org1",
      "uid": "5235a946bfdda7a64d00001a",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235a94ebfdda7a64d000020",
      "index": 2,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [
        0,
        1
      ],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235a955bfdda7a64d000022",
      "index": 3,
      "action": 4,
      "version": 1,
      "user": "u1@org1",
      "uid": "",
      "related": [
        2
      ],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235a97cbfdda7a64d000024",
      "action": 1,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235cc0bbfdda7a64d000029",
      "index": 5,
      "action": 2,
      "version": 1,
      "user": "u1@org1",
      "uid": "5235cc0bbfdda7a64d000025",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235cc11bfdda7a64d00002e",
      "index": 6,
      "action": 2,
      "version": 2,
      "user": "u1@org1",
      "uid": "5235cc11bfdda7a64d00002a",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235cc19bfdda7a64d000033",
      "index": 7,
      "action": 2,
      "version": 3,
      "user": "u1@org1",
      "uid": "5235cc19bfdda7a64d00002f",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235cc31bfdda7a64d000035",
      "index": 8,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235cc96bfdda7a64d000037",
      "index": 9,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [],
      "changed": "2013-09-15T12:33:50.216Z"
    },
    {
      "_id": "5235ce25a14a898550000015",
      "index": 10,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [
        5,
        6,
        7
      ],
      "changed": "2013-09-15T15:11:32.238Z"
    },
    {
      "_id": "5235dcd1a28d42ef56000015",
      "index": 11,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [
        5,
        6,
        7
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dce7a28d42ef5600001a",
      "index": 12,
      "action": 2,
      "version": 1,
      "user": "u1@org1",
      "uid": "5235dce7a28d42ef56000016",
      "related": [],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dcefa28d42ef5600001c",
      "index": 13,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [
        5,
        6,
        7,
        12
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dd09a28d42ef5600001e",
      "index": 14,
      "action": 4,
      "version": 1,
      "user": "u1@org1",
      "uid": "",
      "related": [
        8
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dd0fa28d42ef56000020",
      "index": 15,
      "action": 4,
      "version": 2,
      "user": "u1@org1",
      "uid": "",
      "related": [
        9
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dd14a28d42ef56000022",
      "index": 16,
      "action": 4,
      "version": 3,
      "user": "u1@org1",
      "uid": "",
      "related": [
        10
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dd19a28d42ef56000024",
      "index": 17,
      "action": 4,
      "version": 4,
      "user": "u1@org1",
      "uid": "",
      "related": [
        11
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dd1da28d42ef56000026",
      "index": 18,
      "action": 4,
      "version": 5,
      "user": "u1@org1",
      "uid": "",
      "related": [
        13
      ],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235dd30a28d42ef56000028",
      "action": 1,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [],
      "changed": "2013-09-15T16:14:06.390Z"
    },
    {
      "_id": "5235df55ac09de0259000016",
      "index": 20,
      "action": 3,
      "version": null,
      "user": "u1@org1",
      "uid": "",
      "related": [],
      "changed": "2013-09-15T16:21:44.415Z"
    },
    {
      "_id": "5235df90ac09de0259000018",
      "index": 21,
      "action": 4,
      "version": 1,
      "user": "u1@org1",
      "uid": "",
      "related": [
        20
      ],
      "changed": "2013-09-15T16:21:44.415Z"
    }
  ]
}
```

10. Delete a feed:
http://localhost:3000/winterfell/feed
```JSON
{
	"request":"deletefeed",
	"uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
	"body": {
	        "uuid" : "9d010fa4-7dff-4660-b701-3d4cd3938d44"
	}
}
```


11. Create a new child feed (comment):
http://localhost:3000/winterfell/feed
```JSON
{
    "request":"newchildfeed",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "uuid" : "958255dd-e53c-420a-a073-bf8982189b6d",
                "content": "child feed 2",
                "mentions": ["god"]
    }
}
```
Response:
```JSON
{
  "request": "newchildfeed",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 3,
    "_id": "52360395c3b05def63000014",
    "org": "org1",
    "owner": "u1@org1",
    "private": true,
    "broadcast": false,
    "associations": [
      null
    ],
    "versioned": false,
    "children": [
      {
        "_id": "523603c5c3b05def63000018",
        "owner": "u1@org1",
        "content": [
          {
            "description": "child feed",
            "_id": "523603c5c3b05def63000019",
            "videoFiles": []
          }
        ],
        "updated": "2013-09-15T18:48:41.265Z",
        "created": "2013-09-15T19:00:21.268Z",
        "uuid": "5946bead-90e5-4d7d-a4f0-96841dd89ae8"
      },
      {
        "_id": "523603d2c3b05def6300001a",
        "owner": "u1@org1",
        "content": [
          {
            "description": "child feed 1",
            "_id": "523603d2c3b05def6300001b",
            "videoFiles": []
          }
        ],
        "updated": "2013-09-15T18:48:41.265Z",
        "created": "2013-09-15T19:00:34.265Z",
        "uuid": "5946bead-90e5-4d7d-a4f0-96841dd89ae8"
      },
      {
        "_id": "523603d9c3b05def6300001c",
        "owner": "u1@org1",
        "content": [
          {
            "description": "child feed 2",
            "_id": "523603d9c3b05def6300001d",
            "videoFiles": []
          }
        ],
        "updated": "2013-09-15T18:48:41.265Z",
        "created": "2013-09-15T19:00:41.014Z",
        "uuid": "5946bead-90e5-4d7d-a4f0-96841dd89ae8"
      }
    ],
    "acl": [
      "god"
    ],
    "teams": [],
    "tags": [
      {
        "_id": "52360395c3b05def63000016",
        "name": "first"
      },
      {
        "_id": "52360395c3b05def63000017",
        "name": "second"
      }
    ],
    "content": [
      {
        "description": "main feed",
        "location": "",
        "displayname": "",
        "mime": "",
        "file": "",
        "_id": "52360395c3b05def63000015",
        "videoFiles": []
      }
    ],
    "updated": "2013-09-15T18:48:41.266Z",
    "created": "2013-09-15T18:48:41.266Z",
    "uuid": "958255dd-e53c-420a-a073-bf8982189b6d"
  }
}
```


12. Delete a child feed:
http://localhost:3000/winterfell/feed
```JSON
{
    "request":"deletechildfeed",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
            "uuid" : "958255dd-e53c-420a-a073-bf8982189b6d",
                "childuuid": "25d743d0-f77c-4689-b9b9-a8a6993074b8"
    }
}
```
Response: Same as 11.


Timeline fetchers. each of the below queries also support "slab": "Number" parameteres inside "body"
Each slab fetches 20 entries of results. Slab numbering starts from 0.

12. Retreive user's private timeline:
http://localhost:3000/winterfell/timeline
```JSON
{
    "request":"usertimeline",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
    }
}
```

13. Retreive team timeline:
http://localhost:3000/winterfell/timeline
```JSON
{
    "request":"teamtimeline",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "team": "god"
    }
}
```

14.  Retreive broadcast timeline:
http://localhost:3000/winterfell/timeline
```JSON
{
    "request":"broadcasttimeline",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
    }
}
```

15.  Retreive tag timeline:
http://localhost:3000/winterfell/timeline
```JSON
{
    "request":"tagtimeline",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "tags": ["first", "second"],
        "slab": "3"
    }
}
```

16. List all documents:
http://localhost:3000/winterfell/timeline
```JSON
{
    "request":"listdocs",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
    }
}
```

17. Search for a document (very basic search):
http://localhost:3000/winterfell/timeline
```JSON
{
    "request":"docsearch",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "query": "haha"
    }
}
```

Kingslanding API:
=========

1. Create a tale:
http://localhost:3000/kingslanding/tale
```JSON
{
    "request":"create",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "tale": "Once upon a time, long long ago..."
    }
}
```
Response:
```JSON
{
  "request": "create",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 0,
    "tellerName": "u1@org1",
    "teller": "u1@org1",
    "org": "org1",
    "_id": "523ca85f8dea596612000014",
    "says": [],
    "tale": [
      {
        "type": "none",
        "votes": 0,
        "actorName": "u1@org1",
        "actor": "u1@org1",
        "content": "Once upon a time, long long ago...",
        "org": "org1",
        "_id": "523ca85f8dea596612000015",
        "receivers": [],
        "teams": [],
        "created": "2013-09-20T19:55:54.401Z",
        "uuid": "e1921a55-1a2f-474e-b6c9-8a3b280170a6"
      }
    ],
    "updated": "2013-09-20T19:56:15.323Z",
    "created": "2013-09-20T19:55:54.404Z",
    "uuid": "74ed4fca-a576-43b5-9635-e061e71a9d56"
  }
}
```

2. Destroy a tale:
http://localhost:3000/kingslanding/tale
```JSON
{
    "request":"destroy",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "uuid": "e6607675-5afa-4162-850a-a825b4dcf72b"
    }
}
```
Response:
```JSON
{
  "request": "destroy",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": false
}
```

3. Say something to a tale:
http://localhost:3000/kingslanding/tale
```JSON
{
    "request":"say",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "uuid": "74ed4fca-a576-43b5-9635-e061e71a9d56",
        "saying": "a very vigilant entinel."
    }
}
```
Response:
```JSON
{
  "request": "say",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 3,
    "_id": "523ca85f8dea596612000014",
    "org": "org1",
    "teller": "u1@org1",
    "tellerName": "u1@org1",
    "says": [
      {
        "uuid": "61f6292f-a60c-4c77-9332-6a271c0a1216",
        "created": "2013-09-20T20:05:34.151Z",
        "teams": [],
        "receivers": [],
        "_id": "523caba920ae9c4314000014",
        "org": "org1",
        "content": "there was a sentinel...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "votes": 0,
        "type": "none"
      },
      {
        "uuid": "dca97962-6824-4d1b-b2c3-480121e94f62",
        "created": "2013-09-20T20:12:31.990Z",
        "teams": [],
        "receivers": [],
        "_id": "523cac348d53d1ee14000014",
        "org": "org1",
        "content": "there was a sentinel...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "votes": 0,
        "type": "none"
      },
      {
        "type": "none",
        "votes": 0,
        "actorName": "u1@org1",
        "actor": "u1@org1",
        "content": "a very vigilant entinel.",
        "org": "org1",
        "_id": "523cac4f8d53d1ee14000015",
        "receivers": [],
        "teams": [],
        "created": "2013-09-20T20:12:31.990Z",
        "uuid": "164783d5-1549-4d96-9551-5f5b04903111"
      }
    ],
    "tale": [
      {
        "uuid": "e1921a55-1a2f-474e-b6c9-8a3b280170a6",
        "created": "2013-09-20T19:55:54.401Z",
        "teams": [],
        "receivers": [],
        "_id": "523ca85f8dea596612000015",
        "org": "org1",
        "content": "Once upon a time, long long ago...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "votes": 0,
        "type": "none"
      }
    ],
    "updated": "2013-09-20T20:13:03.451Z",
    "created": "2013-09-20T19:55:54.404Z",
    "uuid": "74ed4fca-a576-43b5-9635-e061e71a9d56"
  }
}
```

4. Un-Say something to a tale:
http://localhost:3000/kingslanding/tale
```JSON
{
    "request":"unsay",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "uuid": "74ed4fca-a576-43b5-9635-e061e71a9d56",
        "sayinguuid": "dca97962-6824-4d1b-b2c3-480121e94f62"
    }
}
```
Response:
```JSON
{
  "request": "unsay",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 4,
    "_id": "523ca85f8dea596612000014",
    "org": "org1",
    "teller": "u1@org1",
    "tellerName": "u1@org1",
    "says": [
      {
        "uuid": "61f6292f-a60c-4c77-9332-6a271c0a1216",
        "created": "2013-09-20T20:05:34.151Z",
        "teams": [],
        "receivers": [],
        "_id": "523caba920ae9c4314000014",
        "org": "org1",
        "content": "there was a sentinel...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "votes": 0,
        "type": "none"
      },
      {
        "uuid": "164783d5-1549-4d96-9551-5f5b04903111",
        "created": "2013-09-20T20:12:31.990Z",
        "teams": [],
        "receivers": [],
        "_id": "523cac4f8d53d1ee14000015",
        "org": "org1",
        "content": "a very vigilant entinel.",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "votes": 0,
        "type": "none"
      }
    ],
    "tale": [
      {
        "uuid": "e1921a55-1a2f-474e-b6c9-8a3b280170a6",
        "created": "2013-09-20T19:55:54.401Z",
        "teams": [],
        "receivers": [],
        "_id": "523ca85f8dea596612000015",
        "org": "org1",
        "content": "Once upon a time, long long ago...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "votes": 0,
        "type": "none"
      }
    ],
    "updated": "2013-09-20T20:17:05.718Z",
    "created": "2013-09-20T19:55:54.404Z",
    "uuid": "74ed4fca-a576-43b5-9635-e061e71a9d56"
  }
}
```

5. Cheer a tale or a saying:
http://localhost:3000/kingslanding/tale
```JSON
{
    "request":"cheer",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "uuid": "2a691f79-00f4-4ae8-8034-86d1c12a2c70"
        // sayinguuid: "#" for cheering a saying
    }
}
```
Response:
```JSON
{
  "request": "cheer",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 0,
    "_id": "523cb17e7826328e17000014",
    "org": "org1",
    "teller": "u1@org1",
    "tellerName": "u1@org1",
    "says": [],
    "tale": [
      {
        "uuid": "9d8a5f9c-0879-4da4-af81-a5486af0c4c4",
        "created": "2013-09-20T20:35:07.404Z",
        "teams": [],
        "receivers": [],
        "votes": [
          "u1@org1"
        ],
        "_id": "523cb17e7826328e17000015",
        "org": "org1",
        "content": "Once upon a time, long long ago...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "type": "none"
      }
    ],
    "updated": "2013-09-20T20:36:08.031Z",
    "created": "2013-09-20T20:35:07.406Z",
    "uuid": "2a691f79-00f4-4ae8-8034-86d1c12a2c70"
  }
}
```

6 Un-Cheer a tale or a saying:
http://localhost:3000/kingslanding/tale
```JSON
{
    "request":"uncheer",
    "uuid":"038b0083-0d58-48a9-b1b2-3d2971e68947",
    "body": {
        "uuid": "2a691f79-00f4-4ae8-8034-86d1c12a2c70"
        // sayinguuid: "#" for un-cheering a saying
    }
}
```
Response:
```JSON
{
  "request": "uncheer",
  "uuid": "038b0083-0d58-48a9-b1b2-3d2971e68947",
  "success": true,
  "msg": {
    "__v": 0,
    "_id": "523cb17e7826328e17000014",
    "org": "org1",
    "teller": "u1@org1",
    "tellerName": "u1@org1",
    "says": [],
    "tale": [
      {
        "uuid": "9d8a5f9c-0879-4da4-af81-a5486af0c4c4",
        "created": "2013-09-20T20:35:07.404Z",
        "teams": [],
        "receivers": [],
        "votes": [],
        "_id": "523cb17e7826328e17000015",
        "org": "org1",
        "content": "Once upon a time, long long ago...",
        "actor": "u1@org1",
        "actorName": "u1@org1",
        "type": "none"
      }
    ],
    "updated": "2013-09-20T20:40:37.392Z",
    "created": "2013-09-20T20:35:07.406Z",
    "uuid": "2a691f79-00f4-4ae8-8034-86d1c12a2c70"
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

Also, most of these APIs are tested with user: god, pass:123
more rigorous testing is on the way after the first barebone feature set is ready.


Todo:

1. a user should be able to leave a team
2. every user should not have the capacity to create teams, or if they do, there has to be a mechanism for the added user to accept the request
        done: only users with admin perm >= admin can perform this action
3. note and review all policies randomly implemented here and there



n. Kingslanding has to handle events throughout the app and maintain its own timeline - mplementation via node eventEmitters?
n+1. app-wide events need handling via node events - study more about it


apis to implement:

1. list entity tree
2. database access permissions
3. account creation process
4. something i absolutely forgot!!!
5. structure databases properly, away from persistence, e.g. history has to be in collection of an org
6. feed search by description
7. other kind of searches e.g. advanced search
8. timeline can actually be implemented implicitly as mongoose post middleware
9. generate posts out of every event
10. there should be a mechanism to choose which commits to pull
11. ability to delete
12. locking in history.js

