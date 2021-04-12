/* eslint-disable react/jsx-no-target-blank */
import React, {useState, useEffect} from 'react'
import { Card, ListGroup, ListGroupItem, Col, Row, Container, Alert, Button } from 'react-bootstrap'
import Cookies from 'js-cookie'

// import Promos from  './Promos'
import StoreNavbar from '../StoreNavbar'
import ManageBooksPopup from './ManageBooksPopup'
import '../styles/Homepage.css'
import '../styles/Background.css'

function Admin(){

    const [errors, setErrors] = useState([])

    const alerts = errors.map(error => 
        <Alert key={error} variant='danger'>
            {error}
        </Alert>
    )

    const [books, setBooks] = useState([])

    useEffect(() => {
        async function fetchBooks(){
            const response = await fetch('http://localhost:3000/api/books')
            const data = await response.json()
            if(data.errors) {
                setErrors(data.errors.split(';'))
            }
            setBooks(data)
        }
        fetchBooks()
    }, [])

    const [showPopup, setShowPopup] = useState(false)
    const [popupBook, setPopupBook] = useState(null)
    function makePopup(book) {
        setShowPopup(true)
        setPopupBook(book)
    }
    const closePopup = () => setShowPopup(false)

    const bookCards = books.map(book => (
        <Col key={book.isbn} xs='3' id = "column-hp">
            <Card id = "card-style-hp">
                <Card.Img className = "mx-auto" id = "image-hp" src={book.cover} />
                <ListGroup id = "lG-hp" className="list-group-flush" >
                    <ListGroupItem id = "lGI-title-hp">
                        <Card.Title>{book.title}</Card.Title>
                        <Card.Subtitle className="text-muted">{book.subtitle}</Card.Subtitle>
                    </ListGroupItem>
                </ListGroup>  
                <ListGroup id = "lG-hp" className="list-group-flush">
                    <ListGroupItem id = "lGI-hp">Author: {book.author}</ListGroupItem>
                </ListGroup>
                <ListGroup id = "lG-hp" className="list-group-flush">
                    <ListGroupItem id = "lGI-hp">Price: ${book.buyPrice}</ListGroupItem>
                </ListGroup>
                <ListGroup className="list-group-flush">
                    <ListGroupItem id = "lGI-links-hp">
                        {Cookies.get('userType') === 'admin' && 
                             <Button onClick={() => makePopup(book)} >Manage Books</Button>
                        }
                        <Card.Link href={book.website}>More Info</Card.Link>
                        <Card.Link href="">Add To Cart</Card.Link>
                    </ListGroupItem>                   
                </ListGroup>
            </Card>
        </Col>

    ))

    return (
        <div id = "background">
            <StoreNavbar homePage={true}/> 
            {alerts}
            <Container id = "cont-hp">
                <Row lg={3} >
                    {bookCards}
                </Row>
            </Container>
            <ManageBooksPopup show={showPopup} book={popupBook} close={closePopup}></ManageBooksPopup>

        </div>
    )

    
}

export default Admin