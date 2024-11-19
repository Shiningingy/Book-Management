document.addEventListener("DOMContentLoaded", function() {
    const addBookForm = document.getElementById('addBookForm');
    const bookListBody = document.getElementById('bookListBody');
    const filterForm = document.getElementById('filterForm');
    const exportCSVButton = document.getElementById('exportCSV');
    const exportJSONButton = document.getElementById('exportJSON');
    const apiUrl = 'http://127.0.0.1:5000/books';
    
    // Fetch and display books on page load
    function fetchBooks() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                // Clear current table body
                bookListBody.innerHTML = '';
                
                // Populate table with books
                data.forEach(book => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="Entry ID">${book.EntryID}</td>
                        <td data-label="Title">${book.Title}</td>
                        <td data-label="Author">${book.Author}</td>
                        <td data-label="Genre">${book.Genre || 'N/A'}</td>
                        <td data-label="Publication Date">${book.PublicationDate}</td>
                        <td data-label="ISBN">${book.ISBN}</td>
                    `;
                    bookListBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error fetching books:', error));
    }

    // Handle adding new book
    addBookForm.addEventListener('submit', function(event) {
        event.preventDefault();
        
        const formData = new FormData(addBookForm);
        const bookData = {
            Title: formData.get('title'),
            Author: formData.get('author'),
            Genre: formData.get('genre'),
            PublicationDate: formData.get('pubDate'),
            ISBN: formData.get('isbn')
        };

        // Send the new book data to the backend
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        })
        .then(response => response.json())
        .then(() => {
            fetchBooks();  // Refresh the book list after adding a new book
            addBookForm.reset();  // Clear the form after submission
        })
        .catch(error => console.error('Error adding book:', error));
    });

    // Handle filtering books
    filterForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const formData = new FormData(filterForm);
        const filterData = {
            Title: formData.get('filterTitle'),
            Author: formData.get('filterAuthor'),
            Genre: formData.get('filterGenre'),
            PublicationDate: formData.get('filterPubDate')
        };

        // Create a query string for filtering
        const query = new URLSearchParams(filterData).toString();

        fetch(`${apiUrl}?${query}`)
            .then(response => response.json())
            .then(data => {
                bookListBody.innerHTML = '';
                data.forEach(book => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td data-label="Entry ID">${book.EntryID}</td>
                        <td data-label="Title">${book.Title}</td>
                        <td data-label="Author">${book.Author}</td>
                        <td data-label="Genre">${book.Genre || 'N/A'}</td>
                        <td data-label="Publication Date">${book.PublicationDate}</td>
                        <td data-label="ISBN">${book.ISBN}</td>
                    `;
                    bookListBody.appendChild(row);
                });
            })
            .catch(error => console.error('Error filtering books:', error));
    });

    // Export books to CSV
    exportCSVButton.addEventListener('click', function() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const csvRows = [];
                // Headers
                const headers = ['Entry ID', 'Title', 'Author', 'Genre', 'Publication Date', 'ISBN'];
                csvRows.push(headers.join(','));

                // Data rows
                data.forEach(book => {
                    const row = [
                        book.EntryID,
                        book.Title,
                        book.Author,
                        book.Genre || 'N/A',
                        book.PublicationDate,
                        book.ISBN
                    ];
                    csvRows.push(row.join(','));
                });

                // Create CSV Blob and download it
                const csvBlob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                const url = URL.createObjectURL(csvBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'book_inventory.csv';
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(error => console.error('Error exporting CSV:', error));
    });

    // Export books to JSON
    exportJSONButton.addEventListener('click', function() {
        fetch(apiUrl)
            .then(response => response.json())
            .then(data => {
                const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(jsonBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'book_inventory.json';
                a.click();
                URL.revokeObjectURL(url);
            })
            .catch(error => console.error('Error exporting JSON:', error));
    });

    // Load books initially
    fetchBooks();
});