const express = require("express");
const path = require("path");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const connectDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3006, () => {
      console.log("project successfully completed");
    });
  } catch (e) {
    console.log(`error:${e.message}`);
    process.exit(1);
  }
};
connectDbServer();

//api 1

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

const outPutResult = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  /*console.log(hasPriorityAndStatusProperties(request.query));
  console.log(hasCategoryAndStatus(request.query));
  console.log(hasCategoryAndPriority(request.query));
  console.log(hasPriorityProperty(request.query));
  console.log(hasStatusProperty(request.query));
  console.log(hasCategoryProperty(request.query));
  console.log(hasSearchProperty(request.query));*/

  /** switch case  */
  switch (true) {
    //scenario 3
    /**----------- has priority and status -------- */
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
      SELECT * FROM todo  WHERE status = '${status}' AND priority = '${priority}';`;
          data = await db.all(getTodosQuery);
          response.send(data.map((eachItem) => outPutResult(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }

      break;

    //scenario 2
    /**-------------- has only priority---------- */
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodosQuery = `
      SELECT * FROM todo WHERE priority = '${priority}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;

    //scenario 1
    /**-------------has only status ------------ */
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodosQuery);
        response.send(data.map((eachItem) => outPutResult(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //has only search property
    //scenario 4
    case hasSearchProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%';`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
      break;

    //default get all todos
    default:
      getTodosQuery = `select * from todo;`;
      data = await db.all(getTodosQuery);
      response.send(data.map((eachItem) => outPutResult(eachItem)));
  }
});

app.get("/todos/", async (request, response) => {
  const { search_q = "", status = "", priority = "" } = request.query;
  const dbObject = `SELECT * FROM todo WHERE
    todo LIKE '%${search_q}%' OR status = '${status}' OR priority = '${priority}';`;
  const final = await db.all(dbObject);
  response.send(final);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbObject = `SELECT * FROM todo WHERE id = ${todoId};`;
  const final = await db.get(dbObject);
  response.send(final);
});

// post

app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status } = todoDetails;
  const dbObj = `INSERT INTO todo (id,todo,priority,status) VALUES('${id}','${todo}','${priority}','${status}');`;
  const final = await db.run(dbObj);
  const todoId = final.lastId;
  response.send("Todo Successfully Added");
});

// // put
// app.put("/todos/:todoId/", async (request, response) => {
//   const { todoId } = request.params;
//   const todoDetails = request.body;
//   const { status } = todoDetails;
//   const dbobj = `UPDATE todo SET status = '${status}' WHERE id =${todoId};`;
//   await db.run(dbobj);
//   response.send("Status Updated");
// });

// put
// app.put("/todos/:todoId/", async (request, response) => {
//   const { todoId } = request.params;

//   const {
//     todo = previousTodo.todo,
//     status = previousTodo.status,
//     priority = previousTodo.priority,
//   } = request.body;
//   console.log(priority);
//   const dbobj = `UPDATE todo SET priority = '${priority}' WHERE id =${todoId};`;
//   const ss = await db.run(dbobj);
//   console.log(ss.priority);
//   response.send(ss);
// });

// // put
// app.put("/todos/:todoId/", async (request, response) => {
//   const { todoId } = request.params;
//   const todoDetails = request.body;
//   const { todo } = todoDetails;
//   const dbobj = `UPDATE todo SET todo = '${todo}' WHERE id =${todoId};`;
//   await db.run(dbobj);
//   response.send("Todo Updated");
// });

// delete
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbobj = `DELETE FROM todo WHERE id = ${todoId};`;
  await db.run(dbobj);
  response.send("Todo Deleted");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
  } = request.body;
  const updateTodoQuery = `UPDATE todo SET todo='${todo}',priority = '${priority}',status = '${status}' WHERE id = ${todoId};`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

module.exports = app;
