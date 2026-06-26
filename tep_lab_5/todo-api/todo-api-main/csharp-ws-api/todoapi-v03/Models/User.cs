using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations.Schema;

namespace TodoApi.Models
{
        [Table("users", Schema = "todoapp")]
        public class User
        {
            public int Id { get; set; }
            public string? Name { get; set; }
            public string? Surname { get; set; }
            public string? Email { get; set; }

    }
}
