from flask import Flask, request, jsonify, send_file, Response
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask_cors import CORS
import os
import csv
import json
from io import StringIO

app = Flask(__name__)
CORS(app)
db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../database/books_inventory.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Database Model
class Inventory(db.Model):
    EntryID = db.Column(db.Integer, primary_key=True)
    Title = db.Column(db.String(255), nullable=False)
    Author = db.Column(db.String(255), nullable=False)
    Genre = db.Column(db.String(100))
    PublicationDate = db.Column(db.Date, nullable=False)
    ISBN = db.Column(db.String(13), unique=True, nullable=False)

# Initialize Database
with app.app_context():
    db.create_all()

# Routes
@app.route('/books', methods=['POST'])
def add_book():
    """Add a new book to the inventory."""
    data = request.json
    try:
        pub_date = datetime.strptime(data['PublicationDate'], '%Y-%m-%d').date()  # Convert string to date
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400
    
    try:
        new_book = Inventory(
            Title=data['Title'],
            Author=data['Author'],
            Genre=data.get('Genre'),
            PublicationDate=pub_date,
            ISBN=data['ISBN']
        )
        db.session.add(new_book)
        db.session.commit()
        return jsonify({"message": "Book added successfully!"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/books', methods=['GET'])
def filter_books():
    """Filter books based on criteria."""
    title = request.args.get('Title')
    author = request.args.get('Author')
    genre = request.args.get('Genre')
    pub_date = request.args.get('PublicationDate')

    query = Inventory.query
    if title:
        query = query.filter(Inventory.Title.like(f"%{title}%"))
    if author:
        query = query.filter(Inventory.Author.like(f"%{author}%"))
    if genre:
        query = query.filter(Inventory.Genre.like(f"%{genre}%"))
    if pub_date:
        query = query.filter(Inventory.PublicationDate == pub_date)

    books = query.all()
    results = [
        {
            "EntryID": book.EntryID,
            "Title": book.Title,
            "Author": book.Author,
            "Genre": book.Genre,
            "PublicationDate": str(book.PublicationDate),
            "ISBN": book.ISBN,
        }
        for book in books
    ]
    return jsonify(results)

@app.route('/books/export', methods=['GET'])
def export_books():
    format = request.args.get('format', 'csv').lower()
    
    if format not in ['csv', 'json']:
        return jsonify({"error": "Unsupported export format. Use 'csv' or 'json'."}), 400
    
    books = Inventory.query.all()
    
    if format == 'csv':
        # Use StringIO for handling strings
        output = StringIO()
        writer = csv.writer(output)
        # Write CSV headers
        writer.writerow(['EntryID', 'Title', 'Author', 'Genre', 'PublicationDate', 'ISBN'])
        # Write book data
        for book in books:
            writer.writerow([book.EntryID, book.Title, book.Author, book.Genre, book.PublicationDate, book.ISBN])
        
        # Convert StringIO data to bytes
        response = Response(
            output.getvalue(),
            mimetype='text/csv',
            headers={'Content-Disposition': 'attachment;filename=books_inventory.csv'}
        )
        return response
    
    elif format == 'json':
        books_data = [
            {
                "EntryID": book.EntryID,
                "Title": book.Title,
                "Author": book.Author,
                "Genre": book.Genre,
                "PublicationDate": str(book.PublicationDate),
                "ISBN": book.ISBN
            }
            for book in books
        ]
        return jsonify(books_data)

if __name__ == "__main__":
    app.run(debug=True)