# Thoughs

Some thoughts about how I see the process in pseudo-pseudo-code

## Questions
- How to manage authentication of users from the backend ?
- How to make it stateless
- Should I only create an API ?
- To add the google account

## Accounts

```javascript
/*
> When showing accounts
- load the list of accounts from the user / database
- load the list of accounts that can be added with their links
- send to the view
*/

/*
> When adding an account
- link redirects to the right login page / or a form
- so the service should return a redirection or a page
- once redirected and back the user may have to add extra infos
- then the service saves the credentials to the store
*/
```

## Generate reports

```javascript
/*
- check first validity of both tokens otherwise display an error
- if it's good get the right file from iOS and Android
- download both CSV files
- parse the files
- render a report
- render a CSV downloadable only if logged in
*/
```

## Others

- There should be some interface or generic service to get the report for each of the selected accounts
- There should be some interface or generic service to parse the results