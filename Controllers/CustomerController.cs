using Backend_CuoiKy.Data;
using Backend_CuoiKy.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend_CuoiKy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomerController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CustomerController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/customer
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var data = await _context.Customer.ToListAsync();
            return Ok(data);
        }

        // GET: api/customer/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var customer = await _context.Customer.FindAsync(id);
            if (customer == null) return NotFound();

            return Ok(customer);
        }

        // POST: api/customer
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Customer model)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            _context.Customer.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        // PUT: api/customer/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] Customer model)
        {
            var customer = await _context.Customer.FindAsync(id);
            if (customer == null) return NotFound();

            customer.Name = model.Name;
            customer.Email = model.Email;
            customer.PhoneNumber = model.PhoneNumber;
            customer.Address = model.Address;

            await _context.SaveChangesAsync();
            return Ok(customer);
        }

        // DELETE: api/customer/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var customer = await _context.Customer.FindAsync(id);
            if (customer == null) return NotFound();

            _context.Customer.Remove(customer);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Deleted successfully" });
        }
    }
}
