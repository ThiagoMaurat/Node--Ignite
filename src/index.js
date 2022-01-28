import express from 'express';
import { v4 } from 'uuid';

const app = express();
app.use(express.json());
// uuid - Universally Unique IDentifier
const customers = []

function getBalance(statement){
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0)
    return balance
}

// Middleware
function verifyIfExistAccountCPF(req, res, next) {
    const { cpf } = req.headers;
    const customer = customers.find(c => c.cpf == cpf);
    if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
    }
    req.customer = customer;
    return next();
}

app.post('/account', (req, res) => {
    const { cpf, name } = req.body;

    const customerAlreadyExists = customers.some(customer => customer.cpf == cpf);

    if (customerAlreadyExists) {
        res.status(400).json({ error: 'Customer already exists' });
    }

    const id = v4();
    customers.push({
        cpf,
        name,
        id,
        statement: [],
    });
    return res.status(201).send();
});

// app.use(verifyIfExistAccountCPF);  -> esse caso só é utilizado
// quando você quer que o middleware seja aplicado em todas as rotas

app.get("/statement", verifyIfExistAccountCPF, (req, res) => {
    const { customer } = req;
    console.log(customer);
    return res.json(customer.statement);

})

app.post("/deposit", verifyIfExistAccountCPF, (req, res) => {
    const {description, amount} = req.body;
    const { customer } = req;
    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"

    }
    customer.statement.push(statementOperation);
    return res.json(customer)
})

app.post("/withdraw", verifyIfExistAccountCPF, (req, res) => {
    const {amount} = req.body;
    const { customer } = req;   
    const balance = getBalance(customer.statement);
    if (balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }
    customer.statement.push(statementOperation);
    return res.status(201).json(customer);
})

app.get("/statement/date", verifyIfExistAccountCPF, (req,res) => {
    const { customer } = req;
    const { date } = req.query;
    const dateFormat = new Date(date + " 00:00");
    const statement = customer.statement.filter(operation => {
        operation.created_at.toDateString() === new Date(dateFormat).toDateString() 
})
    return res.json(statement);
})

app.put("/account", verifyIfExistAccountCPF, (req, res) => {
  const { cpf, name } = req.body;
  const { customer } = req;
  customer.name = name;
  return res.status(201).send();
})

app.listen(3000, () => {
    console.log('Example app listening on port 3000!');
});

app.delete("/account", verifyIfExistAccountCPF, (req, res) => {
   const { customer } = req;
   customers.splice(customer, 1);
    return res.status(200).json(customers);
})

/* 14061685 - rolamento      retentor 12554314   */