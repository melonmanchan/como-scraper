from pymongo import MongoClient

if __name__ == '__main__':
    client = MongoClient('mongodb://%s:%s@127.0.0.1' % ('root', 'password'))
    db = client.articleDB
    res = db.articles.find_one()
    print(res)
